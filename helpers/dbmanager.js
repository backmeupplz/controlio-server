const mongoose = require('mongoose');
const errors = require('./errors');
const _ = require('lodash');
const payments = require('./payments');
const botReporter = require('./botReporter');

// Get schemas
const User = mongoose.model('user');
const Project = mongoose.model('project');
const Post = mongoose.model('post');
const Invite = mongoose.model('invite');

// Users

function findUser(query) {
  return User.findOne(query);
}

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

function findUserById(id) {
  return User.findById(id);
}

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

function addUser(user) {
  return findUser({ email: user.email })
    .then((databaseUser) => {
      if (databaseUser) {
        throw errors.authUserAlreadyExists();
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

function addManager(email) {
  return payments.createStripeCustomer(email.toLowerCase())
    .then((stripeCustomer) => {
      const newUser = new User({
        email,
        addedAsManager: true,
        stripeId: stripeCustomer.id,
      });
      return newUser.save();
    });
}

function removeManagerFromOwner(manager, owner) {
  return new Promise(() => {
    if (!owner.managers.map(v => String(v)).includes(String(manager._id))) {
      throw errors.userNotManager();
    }

    owner.projects.forEach((project) => {
      if (String(project.manager) === String(manager._id)) {
        const projectCopy = Object.create(project);
        projectCopy.manager = owner;
        projectCopy.save();

        const index = manager.projects.map(v => String(v)).indexOf(String(projectCopy._id));
        if (index > -1) {
          manager.projects.splice(index, 1);
        }
      }
    });
    manager.save();

    const index = owner.managers.map(v => String(v)).indexOf(String(manager._id));
    if (index > -1) {
      owner.managers.splice(index, 1);
    }

    return owner.save();
  });
}

function convertToBusiness(userId, convert) {
  return findUserById(userId)
    .then((user) => {
      if (!user) {
        throw errors.noUserFound();
      }
      return user;
    })
    .then((user) => {
      const userCopy = Object.create(user);
      userCopy.isBusiness = convert;
      return userCopy.save();
    });
}

// Projects

function addProject(project) {
  return findUserById(project.userId)
    .then((user) => {
      if (project.type === 'client') {
        return addProjectAsClient(project, user);
      }
      return addProjectAsManager(project, user);
    });
}

function addProjectAsClient(project, user) {
  return new Promise((resolve) => {
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
                resolve({ success: true });
              });
          });
      });
  });
}

function addProjectAsManager(project, user) {
  return new Promise((resolve) => {
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
              .then(() => resolve({ success: true }));
          });
      });
  });
}

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
        project.canEdit = canEdit;
        resolve(project);
      })
      .catch(err => reject(err))
  );
}

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
        const promises = [user.save(), project.save()];
        return Promise.all(promises)
          .then(() => resolve());
      })
      .catch(err => reject(err))
  );
}

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
          const valid = true;
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
      /** Add client invites */
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
        return { user, project };
      })
      .then(({ user, project }) =>
        findUserById(managerId)
          .then((manager) => {
            manager.projects = manager.projects.filter(project => String(project) !== projectId);
            project.managers = project.managers.filter(pManager => !pManager.equals(manager._id));
            const promises = [manager.save(), project.save()];
            return Promise.all(promises);
          })
      )
      .catch(reject)
  );  
}

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
          const valid = true;
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

function archiveProject(userId, projectId, archive) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .populate('owner')
          .then((project) => {
            if (String(project.owner._id) !== String(user._id) &&
                String(project.manager) !== String(user._id)) {
              throw errors.notAuthorized();
            }
            return { user, project };
          })
      )
      .then(({ user, project }) => {
        const maxNumberOfProjects = user.maxNumberOfProjects(user.plan);
        if (maxNumberOfProjects <= user.numberOfActiveProjects && !archive) {
          throw errors.notEnoughProjectsOnPlan(maxNumberOfProjects);
        }
        return { user, project };
      })
      .then(({ user, project }) => {
        const projectCopy = Object.create(project);
        projectCopy.isArchived = archive;

        botReporter.reportArchiveProject(user, projectCopy, archive);
        projectCopy.save()
          .then((savedProject) => {
            const populatedProjectCopy = Object.create(savedProject);
            if (archive) {
              populatedProjectCopy.owner.numberOfActiveProjects -= 1;
            } else {
              populatedProjectCopy.owner.numberOfActiveProjects += 1;
            }
            populatedProjectCopy.owner.save()
              .then(() => resolve(populatedProjectCopy))
              .catch(reject);
          })
          .catch(reject);
      })
      .catch(reject)
  );
}

function deleteProject(userId, projectId) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .populate('clients manager owner')
          .then((project) => {
            if (String(project.owner._id) !== String(user._id) &&
                String(project.manager._id) !== String(user._id)) {
              throw errors.notAuthorized();
            }

            project.clients.forEach((client) => {
              const index = client.projects.map(v => String(v)).indexOf(String(project._id));
              if (index > -1) {
                client.projects.splice(index, 1);
                client.save();
              }
            });

            let index = project.owner.projects.map(v => String(v)).indexOf(String(project._id));
            if (index > -1) {
              project.owner.projects.splice(index, 1);
              if (!project.isArchived) {
                project.owner.numberOfActiveProjects -= 1;
              }
              project.owner.save();
            }
            if (String(project.manager._id) !== String(project.owner._id)) {
              index = project.manager.projects.map(v => String(v)).indexOf(String(project._id));
              if (index > -1) {
                project.manager.projects.splice(index, 1);
                project.manager.save();
              }
            }

            botReporter.reportDeleteProject(user, project);

            project.remove((err) => {
              if (err) {
                throw err;
              } else {
                resolve();
              }
            });
          })
      )
      .then(resolve)
      .catch(reject)
  );
}

// Posts

function addPost(userId, projectId, text, attachments, type) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .then(project => ({ user, project }))
      )
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

function getPosts(userId, projectId, skip, limit) {
  return new Promise(resolve =>
    findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .populate({
            path: 'posts',
            populate: {
              path: 'author',
              model: 'user',
            },
          })
          .then(project => ({ user, project }))
      )
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
        project.clients.forEach((client) => {
          if (client.equals(user._id)) {
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
  );
}

function editPost(userId, postId, text, attachments) {
  return new Promise((resolve, reject) => {
    findUserById(userId)
      .then((user) => {
        Post.findById(postId)
          .populate('project')
          .then((post) => {
            if (String(post.project.owner) !== String(user._id) &&
                String(post.project.manager) !== String(user._id)) {
              reject(errors.notAuthorized());
              return;
            }
            post.text = text;
            post.attachments = attachments;

            botReporter.reportEditPost(user, post);

            post.save()
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

function deletePost(userId, postId) {
  return new Promise(resolve =>
    findUserById(userId)
      .then(user =>
        Post.findById(postId)
          .populate('project')
          .then((post) => {
            if (String(post.project.owner) !== String(user._id) &&
                String(post.project.manager) !== String(user._id)) {
              throw errors.notAuthorized();
            }
            return { user, post };
          })
      )
      .then(({ user, post }) => {
        const index = post.project.posts.map(v => String(v)).indexOf(String(post._id));
        if (index > -1) {
          post.project.posts.splice(index, 1);
        }
        post.project.save();

        botReporter.reportDeletePost(user, post);

        post.remove((err) => {
          if (err) {
            throw err;
          } else {
            resolve();
          }
        });
      })
  );
}

// Payments

function setSripeSubscription(userId, planid) {
  return new Promise((resolve, reject) =>
    findUserById(userId, '+token')
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

function applyStripeCoupon(userId, coupon) {
  return new Promise((resolve, reject) =>
    findUserById(userId, '+token')
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

// Helpers

function addClientsByEmails(emails) {
  return new Promise((resolve, reject) => {
    if (emails.length > 0) {
      const usersToAdd = emails.map(email => ({ email, addedAsClient: true }));
      User.create(usersToAdd)
        .then((addedUsers) => {
          addedUsers.forEach((user) => {
            payments.createStripeCustomer(user.email.toLowerCase())
              .then((stripeCustomer) => {
                user.stripeId = stripeCustomer.id;
                user.save();
              })
              .catch(err => console.error(err));
          });
          resolve(addedUsers);
        })
        .catch(reject);
    } else {
      resolve([]);
    }
  });
}

// Push notifications

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

// Export

module.exports = {
  // Users
  findUser,
  findUserById,
  getProfile,
  addUser,
  addManager,
  removeManagerFromOwner,
  convertToBusiness,
  // Projects
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
  // Posts
  addPost,
  getPosts,
  editPost,
  deletePost,
  // Payments
  setSripeSubscription,
  applyStripeCoupon,
  // Notifications
  removeTokens,
};
