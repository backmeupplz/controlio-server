const mongoose = require('mongoose');
const errors = require('./errors');
const _ = require('lodash');

// Get schemas
const User = mongoose.model('user');
const Project = mongoose.model('project');
const Post = mongoose.model('post');

// Users

function addUser(user) {
  return new Promise((resolve, reject) =>
    User.findOne({ email: user.email.toLowerCase() })
      .then((databaseUser) => {
        if (databaseUser) {
          reject(errors.authUserAlreadyExists());
        } else {
          const newUser = new User(user);
          resolve(newUser.save());
        }
      })
  );
}

function getUserById(id, select, projection, populate) {
  return User.findById(id, projection)
    .select(select || '')
    .populate(populate || '');
}

function getUser(options, select) {
  return User.findOne(options)
    .select(select || '');
}

function addManager(email) {
  const newUser = new User({
    email: email,
    addedAsManager: true,
  });
  return newUser.save();
}

function removeManagerFromOwner(manager, owner) {
  owner.projects.forEach((project) => {
    if (String(project.manager) === String(manager._id)) {
      project.manager = owner;
      project.save();
    }
  });

  const index = owner.managers.map(v => String(v)).indexOf(String(manager._id));
  owner.managers.splice(index, 1);

  return owner.save();
}

// Projects

function addProject(userId, title, image, status, description, manager, clients) {
  return new Promise((resolve, reject) =>
    getUserById(userId)
      .then((ownerObject) => {
        if (!ownerObject) {
          reject(errors.noOwnerFound());
        } else {
          return ownerObject;
        }
      })
      .then(ownerObject =>
        getUserById(manager)
          .then((managerObject) => {
            if (!managerObject) {
              reject(errors.noManagerFound());
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
              reject(errors.noClientObjectsCreated());
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
        const post = new Post({
          text: status,
          project,
          type: 'status',
          manager: project.manager,
        });
        project.lastStatus = post;
        project.posts = [post];
        return post.save()
          .then(() =>
            project.save()
              .then(newProject => ({ ownerObject, managerObject, clientObjects, newProject }))
          );
      })
      .then(({ ownerObject, managerObject, clientObjects, newProject }) => {
        const managerObjectArray = ownerObject.email === managerObject.email ? [] : [managerObject];
        const allObjects = _.union([ownerObject], managerObjectArray, clientObjects);
        // TODO: send clients registration email and\or invite
        allObjects.forEach((object) => {
          object.projects.push(newProject);
          object.save();
        });
        global.botReporter.reportCreateProject(ownerObject, newProject);
        resolve(newProject);
      })
  );
}

function getProjects(userId, skip, limit) {
  return new Promise((resolve, reject) => {
    getUserById(userId, null,
      { projects: { $slice: [skip, limit] } },
      [{ path: 'projects',
        populate: {
          path: 'manager',
          model: 'user',
        },
      },
      { path: 'projects',
        populate: {
          path: 'clients',
          model: 'user',
        },
      },
      { path: 'projects',
        populate: {
          path: 'lastPost',
          model: 'post',
        },
      }])
      .then((user) => {
        user.projects.forEach(project =>
          project.canEdit = String(project.manager._id) === String(user._id) ||
            String(project.owner) === String(user._id)
        );
        if (user) {
          global.botReporter.reportGetProjects(user, skip, limit);
          
          resolve(user.projects);
        } else {
          reject(errors.noUserFound());
        }
      })
      .catch(err => reject(err));
  }
  );
}

function changeClients(projectId, clients) {
  return new Promise((resolve, reject) => {
    Project.findById(projectId)
      .populate('clients')
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

            global.botReporter.reportChangeClients(project);

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

            global.botReporter.reportEditProject(project);

            project.save()
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

// Posts

function addPost(userId, projectId, text, attachments, type) {
  return new Promise(resolve =>
    getUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .populate('clients')
          .then(project => ({ user, project }))
      )
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
          global.botReporter.reportAddPost(user, projectCopy, dbpost);
        } else {
          projectCopy.lastStatus = dbpost._id;
          global.botReporter.reportChangeStatus(user, projectCopy, dbpost);
        }

        return projectCopy.save()
          .then(dbproject => resolve({ dbpost, clients: dbproject.clients, sender: user }));
      })
  );
}

function getPosts(projectId, skip, limit) {
  return new Promise((resolve, reject) => {
    Post.find({ project: new mongoose.Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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

            global.botReporter.reportEditPost(user, post);

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
            const index = post.project.posts.map(v => String(v)).indexOf(String(post._id));
            if (index > -1) {
              post.project.posts.splice(index, 1);
            }
            post.project.save();

            global.botReporter.reportDeletePost(user, post);
            
            post.remove((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

// Helpers

function addClientsByEmails(emails) {
  return new Promise((resolve, reject) => {
    if (emails.length > 0) {
      const usersToAdd = emails.map(email => ({ email, addedAsClient: true }));
      User.create(usersToAdd)
        .then(resolve)
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
  addUser,
  getUserById,
  getUser,
  addManager,
  removeManagerFromOwner,
  // Projects
  addProject,
  getProjects,
  changeClients,
  editProject,
  // Posts
  addPost,
  getPosts,
  editPost,
  deletePost,
  // Notifications
  removeTokens,
};
