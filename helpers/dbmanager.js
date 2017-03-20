/**
 * Manager to encapsulate all actions on database
 *
 * @module dbmanager
 * @license MIT
 */

/** Dependencies */
const mongoose = require('mongoose');
const errors = require('./errors');
const _ = require('lodash');
const payments = require('./payments');
const botReporter = require('./botReporter');
const emailSender = require('./emailSender');

/** Get schemas */
const User = mongoose.model('user');
const Project = mongoose.model('project');
const Post = mongoose.model('post');
const Invite = mongoose.model('invite');

/** Users */

/**
 * Function to get one user from database
 * @param {Mongoose:query} query Query to find the right user
 * @return {Promise(Mongoose:User)} Promise with a User from the database
 */
function findUser(query) {
  return User.findOne(query);
}

/**
 * Function to get one user from database (or create one if it doesn't exist yet)
 * @param {String} email Email of the user to find or create
 * @return {Promise(Mongoose:User)} Promise with the required user
 */
function findOrCreateUserWithEmail(email) {
  return new Promise((resolve, reject) =>
    User.findOne({ email })
      .then((user) => {
        if (user) {
          resolve(user);
          return;
        }
        payments.createStripeCustomer(email)
          .then((stripeCustomer) => {
            const userCopy = { email };
            userCopy.stripeId = stripeCustomer.id;
            const newUser = new User(userCopy);
            return newUser.save()
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      })
  );
}

/**
 * Function to find a user by id
 * @param {Mongoose:ObjectId} id Id of the user to find
 * @return {Promise(Mongoose:User)} User with such id
 */
function findUserById(id) {
  return User.findById(id);
}

/**
 * Function to get user's profile
 * @param {Mongoose:ObjectId} userId Id of the user to get profile
 * @return {Promise(Mongoose:User)} User with one's profile
 */
function getProfile(userId) {
  return new Promise((resolve, reject) => {
    findUserById(userId)
      .then((user) => {
        if (!user) {
          throw errors.noUserFound();
        }
        const userCopy = _.pick(user.toObject(), ['_id', 'email', 'name', 'phone', 'photo']);
        resolve(userCopy);
      })
      .catch(err => reject(err));
  });
}

/**
 * Function to add a user
 * @param {Object} user User object to create new database user
 * @return {Promise(Mongoose:User)} Promise with the User that should be created
 */
function addUser(user) {
  return findUser({ email: user.email })
    .select('password')
    .then((databaseUser) => {
      if (databaseUser) {
        if (!databaseUser.password) {
          databaseUser.generateResetPasswordToken();
          databaseUser.save();
          emailSender.sendSetPassword(databaseUser);
          throw errors.passwordNotExist();
        } else {
          throw errors.authUserAlreadyExists();
        }
      } else {
        return payments.createStripeCustomer(user.email)
          .then((stripeCustomer) => {
            const userCopy = _.clone(user);
            userCopy.stripeId = stripeCustomer.id;
            const newUser = new User(userCopy);
            return newUser.save();
          });
      }
    });
}

/** Projects */

/**
 * Function to add a project to the db
 * @param {Object} project Json of the project to add to the db
 * @return {Promise(Mongoose:Project)} Promise with the Project that should be created
 */
function addProject(project) {
  return findUserById(project.userId)
    .then((user) => {
      if (project.type === 'client') {
        return addProjectAsClient(project, user);
      }
      return addProjectAsManager(project, user);
    });
}

/**
 * Function to add a project as client to the db
 * @param {Object} project Json of the project to add to the db
 * @param {Mongoose:User} user User that adds this project
 * @return {Promise(Mongoose:Project)} Promise with the Project that should be created
 */
function addProjectAsClient(project, user) {
  return new Promise((resolve, reject) => {
    if (user.email === project.managerEmail) {
      throw errors.addSelfAsManager();
    }
    if (!project.managerEmail) {
      throw errors.fieldNotFound('managerEmail');
    }
    return findOrCreateUserWithEmail(project.managerEmail)
      /** Add client */
      .then((manager) => {
        const projectCopy = _.clone(project);
        projectCopy.clients = [user];
        return { projectCopy, manager };
      })
      /** Add initial status if any */
      .then(({ projectCopy, manager }) => {
        if (project.initialStatus) {
          const projectCopyCopy = _.clone(projectCopy);
          const initialStatus = new Post({
            type: 'status',
            text: project.initialStatus,
            author: user,
          });
          if (initialStatus.text.length >= 250) {
            throw errors.errorInitialStatus();
          }
          return initialStatus.save()
            .then((dbInitialStatus) => {
              projectCopyCopy.posts = [dbInitialStatus];
              projectCopyCopy.lastPost = dbInitialStatus;
              projectCopyCopy.lastStatus = dbInitialStatus;
              return { projectCopy: projectCopyCopy, manager };
            });
        }
        return { projectCopy, manager };
      })
      /** Save project to database and add project to client */
      .then(({ projectCopy, manager }) => {
        const newProject = new Project(projectCopy);
        return newProject.save()
          .then((dbProject) => {
            user.projects.push(dbProject);
            return user.save()
              .then(dbUser => ({ dbProject, dbUser, manager }));
          });
      })
      /** Add invite to owner */
      .then(({ dbProject, dbUser, manager }) => {
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
                emailSender.sendInvite(manager.email, dbProject, 'owner');
                resolve(dbProject);
              });
          });
      })
      .catch(err => reject(err));
  });
}

/**
 * Function to add a project as manager to the db
 * @param {Object} project Json of the project to add to the db
 * @param {Mongoose:User} user User that adds this project
 * @return {Promise(Mongoose:Project)} Promise with the Project that should be created
 */
function addProjectAsManager(project, user) {
  return new Promise((resolve, reject) => {
    if (!project.clientEmails) {
      throw errors.fieldNotFound('clientEmails');
    }
    if (project.clientEmails.includes(user.email)) {
      throw errors.addSelfAsClient();
    }
    const promises = [];
    project.clientEmails.forEach((email) => {
      promises.push(findOrCreateUserWithEmail(email));
    });
    return Promise.all(promises)
      /** Add owner */
      .then((clients) => {
        const projectCopy = _.clone(project);
        projectCopy.owner = user;
        return { projectCopy, clients };
      })
      /** Add initial status if any */
      .then(({ projectCopy, clients }) => {
        if (project.initialStatus) {
          const projectCopyCopy = _.clone(projectCopy);
          const initialStatus = new Post({
            type: 'status',
            text: project.initialStatus,
            author: user,
          });
          if (initialStatus.text.length >= 250) {
            throw errors.errorInitialStatus();
          }
          return initialStatus.save()
            .then((dbInitialStatus) => {
              projectCopyCopy.posts = [dbInitialStatus];
              projectCopyCopy.lastPost = dbInitialStatus;
              projectCopyCopy.lastStatus = dbInitialStatus;
              return { projectCopy: projectCopyCopy, clients };
            });
        }
        return { projectCopy, clients };
      })
      /** Save project to database and add project to owner */
      .then(({ projectCopy, clients }) => {
        const newProject = new Project(projectCopy);
        return newProject.save()
          .then((dbProject) => {
            user.projects.push(dbProject);
            return user.save()
              .then(dbUser => ({ dbUser, dbProject, clients }));
          });
      })
      /** Add invites to clients */
      .then(({ dbUser, dbProject, clients }) => {
        const innerPromises = [];
        clients.forEach((client) => {
          emailSender.sendInvite(client.email, dbProject, 'client');
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
            return dbProject.save()
              .then(() => resolve(dbProject));
          });
      })
      .catch(err => reject(err));
  });
}

/**
 * Function to get a list of projects
 * @param {Mongoose:ObjectId} userId Id of the user that's requesting the list
 * @param {Number} skip Skip of the list
 * @param {Number} limit Limit of the list
 * @return {Promise([Mongoose:Project])} Requested list of projects
 */
function getProjects(userId, skip, limit) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .then(user =>
        Project.find({ $or: [{ clients: user._id }, { owner: user._id }, { managers: user._id }] })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('_id updatedAt createdAt title description image lastPost lastStatus isArchived owner managers')
          .populate('lastStatus lastPost')
          .then(projects => ({ user, projects }))
      )
      .then(({ user, projects }) => {
        botReporter.reportGetProjects(user, skip, limit);
        projects.forEach((project) => {
          let canEdit = false;
          if (project.owner && project.owner.equals(user._id)) {
            canEdit = true;
          }
          project.managers.forEach((manager) => {
            if (manager.equals(user._id)) {
              canEdit = true;
            }
          });
          project.canEdit = canEdit;
        });
        resolve(projects);
      })
      .catch(err => reject(err))
  );
}

/**
 * Function to get project by id
 * @param {Mongoose:ObjectId} userId Id of the user who is requesting the project
 * @param {Mongoose:ObjectId} projectId Id of the requested project
 * @return {Promise(Mongoose:Project)} Promise with the requested project
 */
function getProject(userId, projectId) {
  return new Promise((resolve, reject) =>
    /** Get user */
    findUserById(userId)
      .then(user =>
        /** Get project */
        Project.findById(projectId)
        .populate([{
          path: 'invites',
          populate: [{
            path: 'invitee',
            model: 'user',
          }],
        },
        {
          path: 'lastPost',
          model: 'post',
        },
        {
          path: 'lastStatus',
          model: 'post',
        },
        {
          path: 'clients',
          model: 'user',
        },
        {
          path: 'managers',
          model: 'user',
        },
        {
          path: 'owner',
          model: 'user',
        }])
          .then((project) => {
            if (!project) {
              throw errors.noProjectFound();
            }
            return { user, project };
          })
      )
      /** Check if user is authorized to get this project */
      .then(({ user, project }) => {
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
        if (!authorized) {
          throw errors.notAuthorized();
        }
        return { user, project };
      })
      /** Add canEdit field */
      .then(({ user, project }) => {
        let canEdit = false;
        if (project.owner && project.owner._id.equals(user._id)) {
          canEdit = true;
        }
        project.managers.forEach((manager) => {
          if (manager._id.equals(user._id)) {
            canEdit = true;
          }
        });
        project.invites.forEach((invite) => {
          if (invite.invitee._id.equals(user._id)) {
            canEdit = true;
          }
        });
        project.canEdit = canEdit;
        resolve(project);
      })
      .catch(err => reject(err))
  );
}

/**
 * Fucntion to get invites for the user
 * @param {Mongoose:ObjectId} userId Id of the user who's requesting the list of the invites
 * @return {Promise([Mongoose:Invite])} A list of requested invites
 */
function getInvites(userId) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
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
      .then(user => resolve(user.invites))
      .catch(err => reject(err))
  );
}

/**
 * Function to accept or reject invite
 * @param {Mongoose:ObjectId} userId Id of the users who sends the request
 * @param {Mongoose:ObjectId} inviteId Id of the invite that should be accepted or rejected
 * @param {Boolean} accept True if the invite should be accepted and false if rejected
 * @return {Promise()} Promise that's resolved when invite is successfuly accepted or rejected
 */
function acceptInvite(userId, inviteId, accept) {
  return new Promise((resolve, reject) =>
    /** Find user and invite */
    findUserById(userId)
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
          resolve();
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
            return Promise.all(promises)
              .then(() => resolve());
          });
      })
      .catch(err => reject(err))
  );
}

/**
 * Function to delete the invite
 * @param {Mongoose:ObjectId} userId Id of the requesting user
 * @param {Mongoose:ObjectId} inviteId Id of the invite to delete
 * @return {Promise()} Promised that's resolved on success
 */
function removeInvite(userId, inviteId) {
  return new Promise((resolve, reject) =>
    /** Find user and invite */
    findUserById(userId)
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
        const promises = [invite.invitee.save(), invite.project.save()];
        return Promise.all(promises)
          .then(resolve)
          .catch(reject);
      })
      .catch(err => reject(err))
  );
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
    findUserById(userId)
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
      /** Check if archived */
      .then(({ user, project }) => {
        if (project.isArchived) {
          throw errors.projectIsArchived();
        }
        return { project, user };
      })
      /** Get clients objects */
      .then(({ project, user }) => {
        const promises = [];
        managers.forEach((email) => {
          promises.push(findOrCreateUserWithEmail(email));
        });
        return Promise.all(promises)
          .then(managerObjects => ({ managerObjects, project, user }));
      })
      /** Filter managers */
      .then(({ managerObjects, project, user }) => {
        const existingClients = project.clients.map(v => String(v));
        const existingManagers = project.managers.map(v => String(v));
        const owner = String(project.owner);
        const filteredManagerObjects = managerObjects.filter((managerObject) => {
          const id = String(managerObject._id);
          let valid = true;
          if (existingClients.includes(id)) {
            valid = false;
          }
          if (existingManagers.includes(id)) {
            valid = false;
          }
          if (owner === id) {
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
                    emailSender.sendInvite(manager.email, project, 'manager');
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
    findUserById(userId)
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
        findUserById(managerId)
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
    findUserById(userId)
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
      /** Check if archived */
      .then(({ user, project }) => {
        if (project.isArchived) {
          throw errors.projectIsArchived();
        }
        return { project, user };
      })
      /** Get clients objects */
      .then(({ project, user }) => {
        const promises = [];
        clients.forEach((email) => {
          promises.push(findOrCreateUserWithEmail(email));
        });
        return Promise.all(promises)
          .then(clientObjects => ({ clientObjects, project, user }));
      })
      /** Filter clients */
      .then(({ clientObjects, project, user }) => {
        const existingClients = project.clients.map(v => String(v));
        const existingManagers = project.managers.map(v => String(v));
        const owner = String(project.owner);

        const filteredClientObjects = clientObjects.filter((clientObject) => {
          const id = String(clientObject._id);
          let valid = true;
          if (existingClients.includes(id)) {
            valid = false;
          }
          if (existingManagers.includes(id)) {
            valid = false;
          }
          if (owner === id) {
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
          emailSender.sendInvite(client.email, project, 'client');
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
    findUserById(userId)
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
        findUserById(clientId)
          .then((client) => {
            client.projects = client.projects.filter(project => String(project) !== projectId);
            project.clients = project.clients.filter(pclient => !pclient.equals(client._id));
            const promises = [client.save(), project.save()];
            return Promise.all(promises);
          })
      )
      .catch(reject)
  );  
}

function editProject(userId, projectId, title, description, image) {
  return new Promise((resolve, reject) => {
    findUserById(userId)
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
        return project;
      })
      .then((project) => {
        project.title = title;
        project.description = description;
        project.image = image;

        botReporter.reportEditProject(project);

        return project.save()
        .then(resolve)
        .catch(reject);
      })
      .catch(reject);
  });
}

/**
 * Function to archive the project
 * @param {Mongoose:ObjectId} userId If of user who is archiving the project
 * @param {Mongoose:ObjectId} projectId If of the project to archive
 * @param {Boolean} archive True = archive, false = unarchive
 * @return {Promise(Mongoose:Project)} Resulting project
 */
function archiveProject(userId, projectId, archive) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
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
      .then(({ user, project }) => {
        project.isArchived = archive;

        botReporter.reportArchiveProject(user, project, archive);
        return project.save();
      })
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
  return new Promise((resolve, reject) =>
    findUserById(userId)
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
              .then(resolve);
          });
      })
      .then(resolve)
      .catch(reject)
  );
}

/**
 * Method to leave the project
 * @param {Mongoose:ObjectId} userId If of the user who is leaving the project
 * @param {Mongoose:ObjectId} projectId Id of the project to leave
 * @return {Promise()} Promise that's executed upon completion
 */
function leaveProject(userId, projectId) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
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
      })
      .then(resolve)
      .catch(reject)
  );
}

/** Posts */

/**
 * Function to add new post
 * @param {Mongoose:ObjectId} userId Id of the user to add post
 * @param {Mongoose:ObjectId} projectId Id of project where to add post
 * @param {String} text Text of the post
 * @param {[String]]} attachments A list of attachment urls
 * @param {String} type Type (post or status)
 * @return {Promise(Mongoose:Post)} Resulting post
 */
function addPost(userId, projectId, text, attachments, type) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .then(project => ({ user, project }))
      )
      /** Check if owner */
      .then(({ user, project }) => {
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
      /** Check if archived */
      .then(({ user, project }) => {
        if (project.isArchived) {
          throw errors.projectIsArchived();
        }
        return { project, user };
      })
      .then(({ user, project }) => {
        const post = new Post({
          author: user._id,
          text,
          attachments,
          type,
        });
        return post.save()
          .then(dbpost => ({ project, dbpost }));
      })
      .then(({ project, dbpost }) => {
        project.posts.push(dbpost);
        if (dbpost.type === 'status') {
          project.lastStatus = dbpost._id;
        }
        project.lastPost = dbpost._id;
        return project.save()
          .then(() => resolve(dbpost));
      })
      .catch(reject)
  );
}

/**
 * Function to get a list of posts
 * @param {Mongoose:ObjectId} userId Id of the requesting user
 * @param {Mongoose:ObjectId} projectId Id of the project where to get posts
 * @param {Number} skip Skip of this List
 * @param {Number} limit Limit of this list
 * @return {Promise([Mongoose:Post])} A list of requested posts
 */
function getPosts(userId, projectId, skip, limit) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .populate([{
            path: 'posts',
            populate: {
              path: 'author',
              model: 'user',
            },
          },
          {
            path: 'invites',
          }])
          .then(project => ({ user, project }))
      )
      .then(({ user, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        let authorized = false;
        if (project.owner && project.owner.equals(user._id)) {
          authorized = true;
        }
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
        project.invites.forEach((invite) => {
          if (invite.invitee.equals(user._id)) {
            authorized = true;
          }
        });
        if (!authorized) {
          throw errors.notAuthorized();
        }
        const sortedPosts = project.posts.sort((a, b) =>
            b.createdAt - a.createdAt
        );
        const slicedPosts = sortedPosts.slice(skip, skip + limit);
        resolve(slicedPosts);
      })
      .catch(reject)
  );
}

/**
 * Function to edit the post
 * @param {Mongoose:ObjectId} userId Id of editting user
 * @param {Mongoose:ObjectId} projectId Id of the project where post exists
 * @param {Mongoose:ObjectId} postId Id of the post to edit
 * @param {String} text New text
 * @param {[String]} attachments New attachments
 * @return {Promise(Mongoose:Post)} Resulting post
 */
function editPost(userId, projectId, postId, text, attachments) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      /** Get user, post, project */
      .then(user =>
        Post.findById(postId)
          .then(post =>
            Project.findById(projectId)
              .then(project => ({ user, post, project }))
          )
      )
      /** Verify access */
      .then(({ user, post, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        if (!post) {
          throw errors.noPostFound();
        }
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
        return { user, post, project };
      })
      /** Edit post */
      .then(({ user, post, project }) => {
        post.text = text;
        post.attachments = attachments;

        botReporter.reportEditPost(user, post, project);

        return post.save()
          .then(resolve)
          .catch(reject);
      })
      .catch(reject)
  );
}

/**
 * Function to dleete a post
 * @param {Mongoose:ObjectId} userId Id of deleting user
 * @param {Mongoose:ObjectId} projectId Id of the project where post exists
 * @param {Mongoose:ObjectId} postId Id of the post to delete
 * @return {Promise()} Promise thart's resolved on success
 */
function deletePost(userId, projectId, postId) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      /** Get user, post, project */
      .then(user =>
        Post.findById(postId)
          .then(post =>
            Project.findById(projectId)
              .then(project => ({ user, post, project }))
          )
      )
      /** Verify access */
      .then(({ user, post, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        if (!post) {
          throw errors.noPostFound();
        }
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
        return { user, post, project };
      })
      /** Delete post */
      .then(({ user, post, project }) => {
        project.posts = project.posts.filter(id => !id.equals(post.id));
        return project.save()
          .then(() => {
            post.remove((err) => {
              if (err) {
                throw err;
              } else {
                botReporter.reportDeletePost(user, post, project);
                resolve();
              }
            });
          })
          .catch(reject);
      })
      .catch(reject)
  );
}

/** Payments */

/**
 * Method to change user's Stripe subscription id
 * @param {Mongoose:ObjectId} userId Id of the users to get subscription changed
 * @param {Number} planid Id of the plan
 */
function setSripeSubscription(userId, planid) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .select('token email isDemo isAdmin plan stripeId stripeSubscriptionId')
      .then((user) => {
        if (!user) {
          throw errors.noUserFound();
        }
        return user;
      })
      .then(user =>
        payments.setSripeSubscription(user, planid)
          .then(resolve)
          .catch(reject))
  );
}

/**
 * Method to apply stripe coupon
 * @param {Mongoose:ObjectId} userId Id of the user that applies coupon
 * @param {String} coupon Id of the coupon
 */
function applyStripeCoupon(userId, coupon) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .select('token email isDemo isAdmin plan stripeId stripeSubscriptionId')
      .then((user) => {
        if (!user) {
          throw errors.noUserFound();
        }
        return user;
      })
      .then(user =>
        payments.applyStripeCoupon(user, coupon)
          .then(resolve)
          .catch(reject))
  );
}

/** Push notifications */

/**
 * Method to remove push notification tokens
 * @param {[String]]} tokens Tokens to remove
 */
function removeTokens(tokens) {
  tokens.forEach((token) => {
    User.find({ iosPushTokens: token })
      .then((users) => {
        users.forEach((user) => {
          user.iosPushTokens.splice(user.iosPushTokens.indexOf(token), 1);
          user.save();
        });
      })
      .catch(err => console.error(err));
  });
}

/** Exports */
module.exports = {
  /** Users */
  findUser,
  findUserById,
  getProfile,
  addUser,
  /** Projects */
  addProject,
  getProject,
  getProjects,
  getInvites,
  acceptInvite,
  removeInvite,
  addManagers,
  removeManager,
  addClients,
  removeClient,
  editProject,
  archiveProject,
  deleteProject,
  leaveProject,
  /** Posts */
  addPost,
  getPosts,
  editPost,
  deletePost,
  /** Payments */
  setSripeSubscription,
  applyStripeCoupon,
  /** Notifications */
  removeTokens,
};
