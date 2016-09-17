const mongoose = require('mongoose');
const errors = require('./errors.js');
const _ = require('lodash');

// Get schemas
const User = mongoose.model('user');
const Project = mongoose.model('project');
const Post = mongoose.model('post');

// Users

function addUser(user) {
  return new Promise((resolve, reject) => {
    User.findOne({ email: user.email })
      .then(databaseUser => {
        if (databaseUser) {
          reject(errors.authUserAlreadyExists());
        } else {
          const newUser = new User(user);
          return newUser.save();
        }
      });
  });
};

function getUserById(id, select, projection, populate) {
  return new Promise((resolve, reject) => {
    return User.findById(id, projection)
      .select(select || '')
      .populate(populate || '');
  });
};

function getUser(options, select) {
  return User.findOne(options)
    .select(select || '')
}

function addManager(email) {
  return new Promise((resolve, reject) => {
    const newUser = new User({
      email,
      addedAsManager: true
    });
    return newUser.save();
  });
};

// Projects

function addProject(userId, title, image, status, description, manager, clients) {
  return new Promise((resolve, reject) => {
    return getUserById(userId)
      .then(ownerObject => {
        if (!ownerObject) {
          reject(errors.error(500, 'No owner found'));
        } else {
          return ownerObject;
        }
      })
      .then(ownerObject => {
        getUser({ email: manager })
          .then(managerObject => {
            if (managerObject) {
              // TODO: send manager a notice or request for approval
              return { ownerObject, managerObject };
            } else {
              reject(errors.erorr(500, 'No manager found'));
            }
          });
      })
      .then(({ ownerObject, managerObject }) => {
        getClients(clients)
          .then(clientObjects => {
            if (clientObjects) {
              return { ownerObject, managerObject, clientObjects};
            } else {
              reject(errors.error(500, 'No client objects created'));
            }
          });
      })
      .then(({ ownerObject, managerObject, clientObjects }) => {
        const project = new Project({ title, image, status, description, owner: ownerObject, manager: managerObject, clients: clientObjects });
        project.save()
          .then(project => {
            return { ownerObject, managerObject, clientObjects, project };
          });
      })
      .then(({ ownerObject, managerObject, clientObjects, project }) => {
        const managerObjectArray = ownerObject.email === managerObject.email ? [] : [managerObject];
        const allObjects = _.union([ownerObject], managerObjectArray, clientObjects);
        // TODO: send clients registration email and\or invite
        allObjects.forEach(object => {
          object.projects.push(project);
          object.save();
        });
        resolve(project);
      })
  });
};

function getProjects(userId, skip, limit) {
  return new Promise((resolve, reject) => {
    getUserById(userId, 
      null,
      { projects: { $slice: [skip, limit] } }, 
      { path: 'projects',
        populate: {
          path: 'manager',
          model: 'user' 
        } 
      })
      .then(user => {
        if (user) {
          resolve(user.projects);
        } else {
          reject(errors.error(500, 'No user found'));
        }
      })
      .catch(err => reject(err));
  });
};

// Posts

function addPost(projectId, text, attachments) {
  return new Promise((resolve, reject) => {
    Project.findById(projectId)
      .then(project => {
        const post = new Post({
          text,
          project,
          attachments,
          manager: project.manager,
        });
        post.save()
          .then(post => {
              project.posts.push(post);
              project.save()
                .then(resolve);
          });
      })
      .catch(reject);
  });
};

function getPosts(projectId, skip, limit) {
  return new Promise((resolve, reject) => {
    Project.findById(projectId, { posts: { $slice: [skip, limit] } })
      .populate('posts')
      .exec((err, project) => {
        if (err) {
          reject(err);
        } else if (!project) {
          reject(errors.error(500, 'No project found'));
        } else {
          resolve(null, project.posts);
        }
      });
  });
};

// Helpers

function addClientsByEmails(emails, callback) {
  if (emails.length > 0) {
    const usersToAdd = emails.map(email => { 
      return { 
        email,
        addedAsClient: true
      } 
    });
    User.create(usersToAdd, callback);
  } else {
    callback(null, []);
  }
};

function getClients(clientEmails, callback) {
  User.find({ 'email': { $in: clientEmails } }, (err, existingClientObjects) => {
    if (err) {
      callback(err);
    } else if (existingClientObjects) {
      // Check what emails aren't created yet
      const existingClientEmails = existingClientObjects.map(clientObject => clientObject.email);
      const clientsEmailsToCreate = _.difference(clientEmails, existingClientEmails);

      // Create missing users
      addClientsByEmails(clientsEmailsToCreate, (err, addedClientObjects) => {
        if (err) {
          callback(err)
        } else {
          const allClientObjects = existingClientObjects.concat(addedClientObjects);
          callback(err, allClientObjects)
        }
      })
    } else {
      callback(errors.error(500, 'No client objects created'))
    }
  });
};

// Export

module.exports = {
  // Users
  addUser,
  getUserById,
  getUser,
  addManager,
  // Projects
  addProject,
  getProjects,
  // Posts
  addPost,
  getPosts
};