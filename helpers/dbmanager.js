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
    findUserById(userId)
      .then((user) => {
        if (!user) {
          throw errors.noUserFound();
        }
        return user;
      })
      .then(user =>
        Project.findById(projectId)
          .populate('lastStatus lastPost clients owner manager')
          .then((project) => {
            if (!project) {
              throw errors.noProjectFound();
            }
            return { user, project };
          })
      )
      .then(({ user, project }) => {
        let hasAccess = false;
        if (String(project.owner._id) === String(user._id) ||
          String(project.manager._id) === String(user._id) ||
          project.clients.map(v => String(v._id)).includes(String(user._id))) {
          hasAccess = true;
        }

        project.canEdit = String(project.manager._id) === String(user._id) ||
        String(project.owner._id) === String(user._id);
        if (!hasAccess) {
          throw errors.noAccess();
        }
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

function changeClients(userId, projectId, clients) {
  return new Promise((resolve, reject) => {
    Project.findById(projectId)
      .populate('clients')
      .then(project =>
        findUserById(userId)
          .then((user) => {
            if (String(project.owner) !== String(user._id) &&
                String(project.manager) !== String(user._id)) {
              throw errors.notAuthorized();
            } else if (clients.includes(user.email)) {
              throw errors.addSelfAsClient();
            }
            return project;
          })
      )
      .then((project) => {
        const existingClientEmails = project.clients.map(client => client.email);
        const clientsEmailsToRemove = _.difference(existingClientEmails, clients);

        // Add project to new clients and new clients to project,
        // remove unnecessary clients from project
        getClients(clients)
          .then((clientObjects) => {
            clientObjects.forEach((clientObject) => {
              if (!clientObject.projects.map(p => String(p)).includes(String(project._id))) {
                clientObject.projects.push(project._id);
                clientObject.save();
              }
            });
            project.clients = clientObjects;

            botReporter.reportChangeClients(project);

            project.save()
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);

        // Remove project from unnecessary clients
        getClients(clientsEmailsToRemove)
          .then((clientObjects) => {
            clientObjects.forEach((clientObject) => {
              const index = clientObject.projects.map(p =>
                String(p)).indexOf(String(project._id)
              );
              if (index > -1) {
                clientObject.projects.splice(index, 1);
                clientObject.save();
              }
            });
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

function editProject(userId, projectId, title, description, image) {
  return new Promise((resolve, reject) => {
    findUserById(userId)
      .then((user) => {
        Project.findById(projectId)
          .then((project) => {
            if (String(project.owner) !== String(user._id) &&
                String(project.manager) !== String(user._id)) {
              reject(errors.notAuthorized());
              return;
            }

            project.title = title;
            project.description = description;
            project.image = image;

            botReporter.reportEditProject(project);

            project.save()
              .then(resolve)
              .catch(reject);
          })
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
          .populate('clients')
          .then(project => ({ user, project }))
      )
      .then(({ user, project }) => {
        const maxNumberOfProjects = user.maxNumberOfProjects(user.plan);
        if (maxNumberOfProjects < user.numberOfActiveProjects) {
          throw errors.notEnoughProjectsOnPlan(maxNumberOfProjects);
        } else {
          return { user, project };
        }
      })
      .then(({ user, project }) => {
        if (String(project.owner) !== String(user._id) &&
                String(project.manager) !== String(user._id)) {
          throw errors.notAuthorized();
        }
        return { user, project };
      })
      .then(({ user, project }) => {
        const post = new Post({
          text,
          project,
          attachments,
          type,
          manager: project.manager,
        });
        return post.save()
          .then(dbpost => ({ user, project, dbpost }));
      })
      .then(({ user, project, dbpost }) => {
        const projectCopy = Object.create(project);
        projectCopy.posts.push(dbpost);
        if (dbpost.type === 'post') {
          projectCopy.lastPost = dbpost._id;
          botReporter.reportAddPost(user, projectCopy, dbpost);
        } else {
          projectCopy.lastStatus = dbpost._id;
          botReporter.reportChangeStatus(user, projectCopy, dbpost);
        }

        return projectCopy.save()
          .then(dbproject => resolve({ dbpost, clients: dbproject.clients, sender: user }));
      })
      .catch(reject)
  );
}

function getPosts(projectId, skip, limit) {
  return new Promise((resolve, reject) => {
    Project.findById(projectId, {
      posts: { $slice: [0, 3] },
    })
    Post.find({ project: new mongoose.Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('manager')
      .then(resolve)
      .catch(reject);
  });
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

function getClients(clientEmails) {
  return new Promise((resolve, reject) => {
    User.find({ email: { $in: clientEmails } })
      .then((existingClientObjects) => {
        if (existingClientObjects) {
          // Check what emails aren't created yet
          const existingClientEmails =
            existingClientObjects.map(clientObject => clientObject.email);
          const clientsEmailsToCreate = _.difference(clientEmails, existingClientEmails);

          // Create missing users
          addClientsByEmails(clientsEmailsToCreate)
            .then((addedClientObjects) => {
              const allClientObjects = existingClientObjects.concat(addedClientObjects);
              resolve(allClientObjects);
            })
            .catch(reject);
        } else {
          reject(errors.noClientObjectsCreated());
        }
      })
      .catch(reject);
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
  changeClients,
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
