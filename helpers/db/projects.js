/**
 * Manages all db requests for projects
 */

const { Project, Post, Invite } = require('../../models');
const users = require('./users');
const errors = require('../errors');
const demoAccounts = require('../demo').demoAccounts;
const reporter = require('../reporter');

/**
 * Function to add a project to the db
 * @param {Object} project Json of the project to add to the db
 * @return {Promise(Mongoose:Project)} Promise with the Project that should be created
 */
function addProject(project) {
  return users.findUserById(project.userId)
    .then(user => ((project.type === 'client') ?
      addProjectAsClient(project, user) :
      addProjectAsManager(project, user)));
}

/**
 * Function to add a project as client to the db
 * @param {Object} project Json of the project to add to the db
 * @param {Mongoose:User} user User that adds this project
 * @throws {ADD_SELF_AS_MANAGER_ERROR} If User tries to add itself as a manager
 * @throws {ADD_DEMO_AS_MANAGER_ERROR} If User tries to add demo account as a manager
 * @return {Promise(Mongoose:Project)} Promise with the Project that should be created
 */
function addProjectAsClient(project, user) {
  if (user.email === project.managerEmail) {
    throw errors.addSelfAsManager();
  }
  let manager;
  return users.findOrCreateUserWithEmail(project.managerEmail)
    .then((dbmanager) => {
      /** Save manager reference */
      manager = dbmanager;
      /** Check if demo */
      if (manager.isDemo) {
        throw errors.addDemoAsManager();
      }
      /** Add client */
      project.clients = [user];
      return ({ project, author: user });
    })
    .then(addInitialStatus)
    /** Save project to database and add project to client */
    .then((projectWithStatus) => {
      const newProject = new Project(projectWithStatus);
      return newProject.save()
        .then((dbProject) => {
          user.projects.push(dbProject);
          return user.save()
            .then(dbUser => ({ dbProject, dbUser }));
        });
    })
    /** Add invite to owner */
    .then(({ dbProject, dbUser }) => {
      const invite = new Invite({
        type: 'own',
        sender: dbUser._id,
        project: dbProject._id,
        invitee: manager._id,
      });
      return invite.save()
        .then((dbInvite) => {
          dbProject.invites.push(dbInvite._id);
          manager.invites.push(dbInvite._id);
          const promises = [dbProject.save(), manager.save()];
          return Promise.all(promises)
            .then(() => {
              manager.sendInvite(dbProject, 'owner');
              return dbProject;
            });
        });
    });
}

/**
 * Function to add a project as manager to the db
 * @param {Object} project Json of the project to add to the db
 * @param {Mongoose:User} user User that adds this project
 * @throws {ADD_SELF_AS_CLIENT_ERROR} If user is amongst the client emails
 * @throws {ADD_DEMO_AS_CLIENT_ERROR} If demo user is amongst the client emails
 * @return {Promise(Mongoose:Project)} Promise with the Project that should be created
 */
function addProjectAsManager(project, user) {
  if (project.clientEmails.includes(user.email)) {
    throw errors.addSelfAsClient();
  }
  project.clientEmails.forEach((email) => {
    if (demoAccounts.includes(email)) {
      throw errors.addDemoAsClient();
    }
  });
  const promises = [];
  project.clientEmails.forEach((email) => {
    promises.push(users.findOrCreateUserWithEmail(email));
  });
  let clients;
  return checkPlan(user)()
    .then(() => Promise.all(promises))
    .then((dbclients) => {
      /** Save clients reference */
      clients = dbclients;
      /** Add owner */
      project.owner = user;
      return ({ project, author: user });
    })
    .then(addInitialStatus)
    /** Save project to database and add project to owner */
    .then((projectWithStatus) => {
      const newProject = new Project(projectWithStatus);
      return newProject.save()
        .then((dbProject) => {
          user.projects.push(dbProject);
          return user.save()
            .then(dbUser => ({ dbUser, dbProject }));
        });
    })
    /** Add invites to clients */
    .then(({ dbUser, dbProject }) => {
      const innerPromises = [];
      clients.forEach((client) => {
        client.sendInvite(client, dbProject, 'client');
        innerPromises.push(new Promise((resolve) => {
          const invite = new Invite({
            type: 'client',
            sender: dbUser._id,
            project: dbProject._id,
            invitee: client._id,
          });
          return invite.save()
            .then((dbInvite) => {
              client.invites.push(dbInvite);
              return client.save()
                .then(() => {
                  resolve(dbInvite._id);
                });
            });
        }));
      });
      return Promise.all(innerPromises)
        .then((invites) => {
          dbProject.invites = dbProject.invites.concat(invites);
          return dbProject.save();
        });
    });
}

/**
 * Function to get a list of projects
 * @param {Mongoose:ObjectId} userId Id of the user that's requesting the list
 * @param {Number} skip Skip of the list
 * @param {Number} limit Limit of the list
 * @return {Promise([Mongoose:Project])} Requested list of projects
 */
function getProjects(userId, skip, limit, type, query) {
  return users.findUserById(userId)
    .then((user) => {
      const orQuery = [{ clients: user._id }, { owner: user._id }, { managers: user._id }];
      const regexpQuery = { $regex: new RegExp(query.toLowerCase(), 'i') };
      const searchQuery = { $or: orQuery };
      if (type === 'live') {
        searchQuery.isFinished = false;
      } else if (type === 'finished') {
        searchQuery.isFinished = true;
      }
      if (query) {
        searchQuery.title = regexpQuery;
      }
      return Project.find(searchQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id updatedAt createdAt title description image lastPost lastStatus isFinished owner managers')
        .populate([{
          path: 'lastStatus',
          populate: [{
            path: 'author',
            model: 'user',
          }],
        },
        {
          path: 'lastPost',
          populate: [{
            path: 'author',
            model: 'user',
          }],
        }])
        .then(projects => ({ user, projects }));
    })
    .then(({ user, projects }) => {
      projects.forEach((project) => {
        project.canEdit = canEdit(project, user);
      });
      return projects;
    });
}

/**
 * Function to get project by id
 * @param {Mongoose:ObjectId} userId Id of the user who is requesting the project
 * @param {Mongoose:ObjectId} projectId Id of the requested project
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @return {Promise(Mongoose:Project)} Promise with the requested project
 */
function getProject(userId, projectId) {
  return users.findUserById(userId)
    .then(user =>
      /** Get project */
      Project.findById(projectId)
        .populate('lastPost lastStatus clients managers owner')
        .populate({
          path: 'invites',
          populate: [{
            path: 'invitee',
            model: 'user',
          }],
        })
        .then((project) => {
          if (!project) {
            throw errors.noProjectFound();
          }
          return { user, project };
        })
    )
    .then(checkIfAuthorzed)
    /** Add canEdit field */
    .then(({ user, project }) => {
      project.canEdit = canEdit(project, user);
      return project;
    });
}

/**
 * Fucntion to get invites for the user
 * @param {Mongoose:ObjectId} userId Id of the user who's requesting the list of the invites
 * @return {Promise([Mongoose:Invite])} A list of requested invites
 */
function getInvites(userId) {
  return users.findUserById(userId)
    .select('invites')
    .populate({
      path: 'invites',
      populate: [{
        path: 'sender',
        model: 'user',
      },
      {
        path: 'project',
        model: 'project',
      }],
    })
    .then(user => user.invites);
}

/**
 * Function to accept or reject invite
 * @param {Mongoose:ObjectId} userId Id of the users who sends the request
 * @param {Mongoose:ObjectId} inviteId Id of the invite that should be accepted or rejected
 * @param {Boolean} accept True if the invite should be accepted and false if rejected
 * @return {Promise()} Promise that's resolved when invite is successfuly accepted or rejected
 */
function acceptInvite(userId, inviteId, accept) {
  return users.findUserById(userId)
    .then(user =>
      Invite.findById(inviteId)
        .populate('project')
        .then((invite) => {
          if (!invite) {
            throw errors.noInviteFound();
          }
          return { user, invite };
        })
    )
    .then(({ user, invite }) =>
      checkPlan(user, false, invite.type !== 'own' || !accept)({ user, invite }))
    /** Remove invite from user and project */
    .then(({ user, invite }) => {
      // Remove invite from user
      user.invites = user.invites.filter(i => !i.equals(invite._id));
      // Remove invite from project
      invite.project.invites = invite.project.invites.filter(i => !i.equals(invite._id));
      const promises = [user.save(), invite.save()];
      return Promise.all(promises)
        .then(() => ({ user, invite }));
    })
    .then(({ user, invite }) => {
      if (!accept) {
        return;
      }

      const project = invite.project;
      if (invite.type === 'manage') {
        project.managers.push(user._id);
        user.projects.push(project._id);
      } else if (invite.type === 'own') {
        project.owner = user._id;
        user.projects.push(project._id);
      } else if (invite.type === 'client') {
        project.clients.push(user._id);
        user.projects.push(project._id);
      }
      // Remove invite from DB
      return invite.remove()
        .then(() => {
          const promises = [user.save(), project.save()];
          return Promise.all(promises);
        });
    });
}

/**
 * Function to delete the invite
 * @param {Mongoose:ObjectId} userId Id of the requesting user
 * @param {Mongoose:ObjectId} inviteId Id of the invite to delete
 * @return {Promise()} Promised that's resolved on success
 */
function removeInvite(userId, inviteId) {
  return users.findUserById(userId)
    .then(user =>
      Invite.findById(inviteId)
        .populate('project invitee')
        .then((invite) => {
          if (!invite) {
            throw errors.noInviteFound();
          }
          return { user, invite };
        })
    )
    .then(({ user, invite }) => {
      let authorized = false;
      if (invite.project.owner && invite.project.owner.equals(user._id)) {
        authorized = true;
      }
      invite.project.managers.forEach((manager) => {
        if (manager.equals(user._id) && invite.type === 'client') {
          authorized = true;
        }
      });
      if (!authorized) {
        throw errors.notAuthorized();
      }
      return invite;
    })
    /** Remove invite from user and project */
    .then((invite) => {
      // Remove invite from user
      invite.invitee.invites = invite.invitee.invites.filter(i => !i.equals(invite._id));
      // Remove invite from project
      invite.project.invites = invite.project.invites.filter(i => !i.equals(invite._id));
      return Promise.all([invite.invitee.save(), invite.project.save()]);
    });
}

/**
 * Function to add managers to the project
 * @param {Mongoose:ObjectId} userId Id of the user that's adding managers
 * @param {Mongoose:ObjectId} projectId Id of the project to add managers
 * @param {[String]]} managers List of emails of managers to add
 * @return {Promise()} Promise that's resolved on success
 */
function addManagers(userId, projectId, managers) {
  return new Promise((resolve, reject) =>
    /** Find user and project */
    users.findUserById(userId)
      .then(user => checkPlan(user, true)(user))
      .then(user =>
        Project.findById(projectId)
          .then((project) => {
            if (!project) {
              throw errors.noProjectFound();
            }
            if (project.managers.length >= 100) {
              throw errors.managersOverLimit();
            }
            return { user, project };
          })
      )
      /** Check if owner */
      .then(({ user, project }) => {
        let authorized = false;
        if (project.owner && project.owner.equals(user._id)) {
          authorized = true;
        }
        if (!authorized) {
          throw errors.notAuthorized();
        }
        return { project, user };
      })
      /** Check if finished */
      .then(({ user, project }) => {
        if (project.isFinished) {
          throw errors.projectIsFinished();
        }
        return { project, user };
      })
      /** Get managers objects */
      .then(({ project, user }) => {
        const promises = [];
        managers.forEach((email) => {
          promises.push(users.findOrCreateUserWithEmail(email));
        });
        return Promise.all(promises)
          .then(managerObjects => ({ managerObjects, project, user }));
      })
      /** Filter managers */
      .then(({ managerObjects, project, user }) => {
        const existingClients = project.clients.map(v => String(v));
        const existingManagers = project.managers.map(v => String(v));
        const existingInvites = project.invites.map(v => String(v));
        const owner = String(project.owner);

        const filteredManagerObjects = managerObjects.filter((managerObject) => {
          const id = String(managerObject._id);
          const managerInvites = managerObject.invites.map(v => String(v));
          let valid = true;
          existingInvites.forEach((invite) => {
            if (managerInvites.includes(invite)) {
              valid = false;
            }
          });
          if (existingClients.includes(id)) {
            valid = false;
          }
          if (existingManagers.includes(id)) {
            valid = false;
          }
          if (owner === id) {
            valid = false;
          }
          if (managerObject.isDemo) {
            valid = false;
          }
          return valid;
        });
        return { managerObjects: filteredManagerObjects, project, user };
      })
      /** Add manager invites */
      .then(({ managerObjects, project, user }) => {
        const innerPromises = [];
        managerObjects.forEach((manager) => {
          innerPromises.push(new Promise((resolve) => {
            const invite = new Invite({
              type: 'manage',
              sender: user._id,
              project: project._id,
              invitee: manager._id,
            });
            return invite.save()
              .then((dbInvite) => {
                manager.invites.push(dbInvite);
                return manager.save()
                  .then(() => {
                    manager.sendInvite(project, 'manager');
                    resolve(dbInvite._id);
                  });
              });
          }));
        });
        return Promise.all(innerPromises)
          .then((invites) => {
            project.invites = project.invites.concat(invites);
            return project.save()
              .then(() => resolve({ success: true }));
          });
      })
      .catch(err => reject(err))
  );
}

/**
 * Function to remove manager from project
 * @param {Mongoose:ObjectId} userId If of user who performs the action
 * @param {Mongoose:ObjectId} managerId Id of manager to remove
 * @param {Mongoose:ObjectId} projectId Id of project from where remove the manager
 * @return {Promise()} Promise that's resolved on success
 */
function removeManager(userId, managerId, projectId) {
  return new Promise((resolve, reject) =>
    users.findUserById(userId)
      .then(user =>
        getProjectsOwned(user._id)
          .then((count) => {
            if (count > user.maxProjects()) {
              throw errors.notEnoughProjectsOnPlan();
            }
            return user;
          }))
      .then(user =>
        Project.findById(projectId)
          .then(project => ({ user, project }))
      )
      .then(({ user, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        let authorized = false;
        if (project.owner.equals(user._id)) {
          authorized = true;
        }
        if (!authorized) {
          throw errors.notAuthorized();
        }
        return project;
      })
      .then(project =>
        users.findUserById(managerId)
          .then((manager) => {
            manager.projects = manager.projects.filter(dbProject => String(dbProject) !== projectId);
            project.managers = project.managers.filter(pManager => !pManager.equals(manager._id));
            const promises = [manager.save(), project.save()];
            return Promise.all(promises)
              .then(resolve)
              .catch(reject);
          })
      )
      .catch(reject)
  );
}

/**
 * Function to add clients to the project
 * @param {Mongoose:ObjectId} userId Id of the user that's adding clients
 * @param {Mongoose:ObjectId} projectId Id of the project to add clients
 * @param {[String]]} clients List of emails of clients to add
 * @return {Promise()} Promise that's resolved on success
 */
function addClients(userId, projectId, clients) {
  return new Promise((resolve, reject) =>
    /** Find user and project */
    users.findUserById(userId)
      .then(user =>
        getProjectsOwned(user._id)
          .then((count) => {
            if (count > user.maxProjects()) {
              throw errors.notEnoughProjectsOnPlan();
            }
            return user;
          }))
      .then(user =>
        Project.findById(projectId)
          .then((project) => {
            if (!project) {
              throw errors.noProjectFound();
            }
            if (project.clients.length >= 100) {
              throw errors.usersOverLimit();
            }
            return { user, project };
          })
      )
      /** Check if owner or manager */
      .then(({ user, project }) => {
        let authorized = false;
        if (project.owner && project.owner.equals(user._id)) {
          authorized = true;
        }
        project.managers.forEach((manager) => {
          if (manager.equals(user._id)) {
            authorized = true;
          }
        });
        if (!authorized) {
          throw errors.notAuthorized();
        }
        return { project, user };
      })
      /** Check if finished */
      .then(({ user, project }) => {
        if (project.isFinished) {
          throw errors.projectIsFinished();
        }
        return { project, user };
      })
      /** Get clients objects */
      .then(({ project, user }) => {
        const promises = [];
        clients.forEach((email) => {
          promises.push(users.findOrCreateUserWithEmail(email));
        });
        return Promise.all(promises)
          .then(clientObjects => ({ clientObjects, project, user }));
      })
      /** Filter clients */
      .then(({ clientObjects, project, user }) => {
        const existingClients = project.clients.map(v => String(v));
        const existingManagers = project.managers.map(v => String(v));
        const existingInvites = project.invites.map(v => String(v));
        const owner = String(project.owner);

        const filteredClientObjects = clientObjects.filter((clientObject) => {
          const id = String(clientObject._id);
          const clientInvites = clientObject.invites.map(v => String(v));
          let valid = true;
          if (existingInvites) {
            existingInvites.forEach((invite) => {
              if (clientInvites.includes(invite)) {
                valid = false;
              }
            });
          }
          if (existingClients.includes(id)) {
            valid = false;
          }
          if (existingManagers.includes(id)) {
            valid = false;
          }
          if (owner === id) {
            valid = false;
          }
          if (clientObject.isDemo) {
            valid = false;
          }
          return valid;
        });
        return { clientObjects: filteredClientObjects, project, user };
      })
      /** Add client invites */
      .then(({ clientObjects, project, user }) => {
        const innerPromises = [];
        clientObjects.forEach((client) => {
          client.sendInvite(project, 'client');
          innerPromises.push(new Promise((resolve) => {
            const invite = new Invite({
              type: 'client',
              sender: user._id,
              project: project._id,
              invitee: client._id,
            });
            return invite.save()
              .then((dbInvite) => {
                client.invites.push(dbInvite);
                return client.save()
                  .then(() => {
                    resolve(dbInvite._id);
                  });
              });
          }));
        });
        return Promise.all(innerPromises)
          .then((invites) => {
            project.invites = project.invites.concat(invites);
            return project.save()
              .then(() => resolve({ success: true }));
          });
      })
      .catch(err => reject(err))
  );
}

/**
 * Function to remove client from project
 * @param {Mongoose:ObjectId} userId If of user who performs the action
 * @param {Mongoose:ObjectId} clientId Id of client to remove
 * @param {Mongoose:ObjectId} projectId Id of project from where remove the client
 * @return {Promise()} Promise that's resolved on success
 */
function removeClient(userId, clientId, projectId) {
  return new Promise((resolve, reject) =>
    users.findUserById(userId)
      .then(user =>
        getProjectsOwned(user._id)
          .then((count) => {
            if (count > user.maxProjects()) {
              throw errors.notEnoughProjectsOnPlan();
            }
            return user;
          }))
      .then(user =>
        Project.findById(projectId)
          .then(project => ({ user, project }))
      )
      .then(({ user, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        let authorized = false;
        if (project.owner.equals(user._id)) {
          authorized = true;
        }
        project.managers.forEach((manager) => {
          if (manager.equals(user._id)) {
            authorized = true;
          }
        });
        if (!authorized) {
          throw errors.notAuthorized();
        }
        return { user, project };
      })
      .then(({ user, project }) =>
        users.findUserById(clientId)
          .then((client) => {
            client.projects = client.projects.filter(project => String(project) !== projectId);
            project.clients = project.clients.filter(pclient => !pclient.equals(client._id));
            const promises = [client.save(), project.save()];
            return Promise.all(promises)
              .then(resolve)
              .catch(reject);
          })
      )
      .catch(reject)
  );
}

function editProject(userId, projectId, title, description, image) {
  return new Promise((resolve, reject) => {
    users.findUserById(userId)
      .then(user =>
        getProjectsOwned(user._id)
          .then((count) => {
            if (count > user.maxProjects()) {
              throw errors.notEnoughProjectsOnPlan();
            }
            return user;
          }))
      .then(user =>
        Project.findById(projectId)
          .then(project => ({ user, project })))
      .then(({ user, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        let authorized = false;
        if (project.owner.equals(user._id)) {
          authorized = true;
        }
        project.managers.forEach((manager) => {
          if (manager.equals(user._id)) {
            authorized = true;
          }
        });
        if (!authorized) {
          throw errors.notAuthorized();
        }
        return { user, project };
      })
      .then(({ user, project }) => {
        project.title = title;
        project.description = description;
        project.image = image;

        reporter.reportEditProject(user, project);

        return project.save()
        .then(resolve)
        .catch(reject);
      })
      .catch(reject);
  });
}

/**
 * Function to finish the project
 * @param {Mongoose:ObjectId} userId If of user who is finishing the project
 * @param {Mongoose:ObjectId} projectId If of the project to finish
 * @param {Boolean} finish True = finish, false = revive
 * @return {Promise(Mongoose:Project)} Resulting project
 */
function finishProject(userId, projectId, finish) {
  return new Promise((resolve, reject) =>
    users.findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .populate('owner')
          .then((project) => {
            if (!project.owner || !project.owner._id.equals(user._id)) {
              throw errors.notAuthorized();
            }
            return { user, project };
          })
      )
      .then(({ user, project }) =>
        getProjectsOwned(user._id)
          .then((count) => {
            if (count >= user.maxProjects() && !finish) {
              throw errors.notEnoughProjectsOnPlan();
            }
            project.isFinished = finish;

            reporter.reportFinishProject(user, project, finish);
            return project.save();
          }))
      .then(resolve)
      .catch(reject)
  );
}

/**
 * Function to delete project
 * @param {Mongoose:ObjectId} userId Id of the user who deletes the project
 * @param {Mongoose:ObjectId} projectId If of the project to delete
 * @return {Promise()} Promise that gets resolved on success
 */
function deleteProject(userId, projectId) {
  return users.findUserById(userId)
    /** Get user and project */
    .then(user =>
      Project.findById(projectId)
        .populate('clients managers')
          .then((project) => {
            if (!project) {
              throw errors.noProjectFound();
            }
            return { user, project };
          })
    )
    /** Check if user is an owner */
    .then(({ user, project }) => {
      if (!(project.owner && project.owner.equals(user._id))) {
        throw errors.notAuthorized();
      }
      return { user, project };
    })
    /** Delete project */
    .then(({ user, project }) => {
      /** Remove project from owner */
      user.projects = user.projects.filter(id => !id.equals(project._id));
      /** Remove project from clients and managers */
      project.clients.forEach((client) => {
        client.projects = client.projects.filter(id => !id.equals(project._id));
      });
      project.managers.forEach((manager) => {
        manager.projects = manager.projects.filter(id => !id.equals(project._id));
      });
      /** Remove all invites */
      const invitePromises = [];
      project.invites.forEach((id) => {
        invitePromises.push(removeInvite(userId, String(id)));
      });
      /** Celan up the project */
      project.clients = [];
      project.managers = [];
      project.owner = null;
      return Promise.all(invitePromises)
        .then(() => {
          const promises = [];
          promises.push(project.save());
          promises.push(user.save());
          project.clients.forEach((client) => {
            promises.push(client.save());
          });
          project.managers.forEach((manager) => {
            promises.push(manager.save());
          });
          return Promise.all(promises)
            .then(() =>
              project.remove((err) => {
                if (err) {
                  throw err;
                } else {
                  return;
                }
              }));
        });
    });
}

/**
 * Method to leave the project
 * @param {Mongoose:ObjectId} userId If of the user who is leaving the project
 * @param {Mongoose:ObjectId} projectId Id of the project to leave
 * @return {Promise()} Promise that's executed upon completion
 */
function leaveProject(userId, projectId) {
  return users.findUserById(userId)
    /** Get user and project */
    .then(user =>
      Project.findById(projectId)
        .then((project) => {
          if (!project) {
            throw errors.noProjectFound();
          }
          return { user, project };
        })
    )
    /** Check if user is not an owner */
    .then(({ user, project }) => {
      if (project.owner && project.owner.equals(user._id)) {
        throw errors.leaveAsOwner();
      }
      return { user, project };
    })
    /** Check if user is authorized */
    .then(({ user, project }) => {
      let authorized = false;
      project.managers.forEach((manager) => {
        if (manager.equals(user._id)) {
          authorized = true;
        }
      });
      project.clients.forEach((client) => {
        if (client.equals(user._id)) {
          authorized = true;
        }
      });
      if (!authorized) {
        throw errors.notAuthorized();
      }
      return { user, project };
    })
    /** Leave project */
    .then(({ user, project }) => {
      user.projects = user.projects.filter(id => String(id) !== projectId);
      project.managers = project.managers.filter(pManager => !pManager.equals(user._id));
      project.clients = project.clients.filter(pClient => !pClient.equals(user._id));
      const promises = [user.save(), project.save()];
      return Promise.all(promises);
    });
}

/**
 * Function to add initial status to project if specified
 * @param {Object} options.project JS object representing project
 * @param {Mongoose:User} options.author User that's going to be the author of the first status
 */
function addInitialStatus({ project, author }) {
  if (project.initialStatus) {
    const initialStatus = new Post({
      type: 'status',
      text: project.initialStatus,
      author,
    });
    return initialStatus.save()
      .then((dbInitialStatus) => {
        project.posts = [dbInitialStatus];
        project.lastPost = dbInitialStatus;
        project.lastStatus = dbInitialStatus;
        return project;
      });
  }
  return project;
}

/**
 * Function that checks user authorization on project
 */
function checkIfAuthorzed({ user, project }) {
  let authorized = false;
  if (project.owner && project.owner._id.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager._id.equals(user._id)) {
      authorized = true;
    }
  });
  project.clients.forEach((client) => {
    if (client._id.equals(user._id)) {
      authorized = true;
    }
  });
  project.invites.forEach((invite) => {
    if (invite.invitee._id.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  return { user, project };
}

/** Function to verify if user can edit project */
function canEdit(project, user) {
  let can = false;
  if (project.owner && (project.owner.equals(user._id) ||
    (project.owner._id && project.owner._id.equals(user._id)))) {
    can = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id) ||
      (manager._id && manager._id.equals(user._id))) {
      can = true;
    }
  });
  return can;
}

/** Function to check if user has enough available projects on plan */
function checkPlan(user, allowsEqual, bypass) {
  return data => getProjectsOwned(user._id)
    .then((count) => {
      if (bypass) {
        return data;
      }
      if (allowsEqual) {
        if (count > user.maxProjects()) {
          throw errors.notEnoughProjectsOnPlan();
        }
      } else if (count >= user.maxProjects()) {
        throw errors.notEnoughProjectsOnPlan();
      }
      return data;
    });
}

/**
 * Function to get count of projects owned
 * @param {Mongoose:ObjectId} userId Id of the user
 * @return {Promise(Int)} Count of projects owned
 */
function getProjectsOwned(userId) {
  return new Promise((resolve, reject) => {
    Project.count({ owner: userId, isFinished: false }, (err, c) => {
      if (err) {
        reject(err);
      } else {
        resolve(c);
      }
    });
  });
}

module.exports = {
  addProject,
  getProjects,
  getProject,
  getInvites,
  acceptInvite,
  removeInvite,
  addManagers,
  removeManager,
  addClients,
  removeClient,
  editProject,
  finishProject,
  deleteProject,
  leaveProject,
  getProjectsOwned,
};
