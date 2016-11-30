const mongoose = require('mongoose');
const errors = require('./errors');
const _ = require('lodash');
const payments = require('./payments');
const botReporter = require('./botReporter');

// Get schemas
const User = mongoose.model('user');
const Project = mongoose.model('project');
const Post = mongoose.model('post');

// Users

function findUser(options) {
  return User.findOne(options);
}

function findUserById(id, projection) {
  return User.findById(id, projection);
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
  return getUserById(userId)
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

function addProject(userId, title, image, status, description, manager, clients) {
  return new Promise((resolve, reject) =>
    getUserById(userId)
      .then((ownerObject) => {
        if (!ownerObject) {
          throw errors.noOwnerFound();
        } else if (clients.includes(ownerObject.email)) {
          throw errors.addSelfAsClient();
        } else {
          return ownerObject;
        }
      })
      .then((ownerObject) => {
        const maxNumberOfProjects = ownerObject.maxNumberOfProjects(ownerObject.plan);
        if (maxNumberOfProjects <= ownerObject.numberOfActiveProjects) {
          throw errors.notEnoughProjectsOnPlan(maxNumberOfProjects);
        } else {
          return ownerObject;
        }
      })
      .then(ownerObject =>
        getUserById(manager)
          .then((managerObject) => {
            if (!managerObject) {
              throw errors.noManagerFound();
            } else {
              // TODO: send manager a notice or request for approval
              return { ownerObject, managerObject };
            }
          })
      )
      .then(({ ownerObject, managerObject }) =>
        getClients(clients)
          .then((clientObjects) => {
            if (!clientObjects) {
              throw errors.noClientObjectsCreated();
            } else {
              return { ownerObject, managerObject, clientObjects };
            }
          })
      )
      .then(({ ownerObject, managerObject, clientObjects }) => {
        const project = new Project({
          title,
          image,
          description,
          owner: ownerObject,
          manager: managerObject,
          clients: clientObjects,
        });
        return project.save()
          .then(newProject => ({ ownerObject, managerObject, clientObjects, newProject }));
      })
      .then(({ ownerObject, managerObject, clientObjects, newProject }) => {
        const managerObjectArray = ownerObject.email === managerObject.email ? [] : [managerObject];
        const allObjects = _.union([ownerObject], managerObjectArray, clientObjects);

        // TODO: send clients registration email and\or invite
        allObjects.forEach((object) => {
          if (object.email === ownerObject.email) {
            object.numberOfActiveProjects += 1;
          }
          object.projects.push(newProject);
          object.save();
        });
        botReporter.reportCreateProject(ownerObject, newProject);
        return newProject;
      })
      .then(project => addPost(project.owner._id, project._id, status, [], 'status'))
      .then(() => resolve({ success: true }))
      .catch(reject)
  );
}

function getProject(userId, projectId) {
  return new Promise((resolve, reject) =>
    getUserById(userId)
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

function getProjects(userId, skip, limit) {
  return new Promise((resolve, reject) =>
    getUserById(userId)
      .then((user) => {
        if (!user) {
          throw errors.noUserFound();
        }
        return user;
      })
      .then(user =>
        Project.find({ $or: [{ clients: user._id }, { owner: user._id }, { manager: user._id }] })
          .sort({ isArchived: 1 })
          .skip(skip)
          .limit(limit)
          .populate('clients owner manager lastStatus lastPost')
          .then(projects => ({ user, projects }))
      )
      .then(({ user, projects }) => {
        projects.forEach((project) => {
          project.canEdit = String(project.manager._id) === String(user._id) ||
            String(project.owner._id) === String(user._id);
        });

        botReporter.reportGetProjects(user, skip, limit);
        resolve(projects);
      })
      .catch(err => reject(err))
  );
}

function changeClients(userId, projectId, clients) {
  return new Promise((resolve, reject) => {
    Project.findById(projectId)
      .populate('clients')
      .then(project =>
        getUserById(userId)
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
    getUserById(userId)
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
    getUserById(userId)
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
    getUserById(userId)
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
    getUserById(userId)
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
    getUserById(userId)
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
    getUserById(userId)
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
    getUserById(userId, '+token')
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
    getUserById(userId, '+token')
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
