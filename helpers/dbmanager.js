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
  return new Promise((resolve, reject) => {
    return User.findOne(options)
      .select(select || '')
      .then(resolve)
      .catch(reject);
  });
};

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

function addProject(req, callback) {
  const userId = req.get('x-access-user-id');
  const title = req.body.title;
  const image = req.body.image;
  const status = req.body.status;
  const description = req.body.description;
  const manager = req.body.manager;
  const clients = req.body.clients;

  // Add project

  function getClientsCallback(err, clientObjects, managerObject, ownerObject) {
    if (err) {
      callback(err);
    } else if (clientObjects) {
      const project = new Project({
        title,
        image,
        status,
        description,
        owner: ownerObject,
        manager: managerObject,
        clients: clientObjects
      });
      project.save((err, project) => {
        if (err) {
          callback(err);
        } else {
          const managerObjectArray = ownerObject.email === managerObject.email ? [] : [managerObject];
          const allObjects = _.union([ownerObject], managerObjectArray, clientObjects);
          // TODO: send clients registration email and\or invite
          allObjects.forEach(object => {
            object.projects.push(project);
            object.save();
          });
          callback(null, project);
        }
      });
    } else {
      callback(errors.error(500, 'No client objects created'));
    }
  };

  function getManagerCallback(managerObject, ownerObject) {
    if (managerObject) {
      // TODO: send manager a notice or request for approval
      getClients(clients, (err, clientObjects) => {
        getClientsCallback(err, clientObjects, managerObject, ownerObject);
      });
    } else {
      callback(errors.erorr(500, 'No manager found'));
    }
  };

  function getOwnerCallback(err, ownerObject) {
    if (err) {
      callback(err);
    } else if (!ownerObject) {
      callback(errors.error(500, 'No owner found'));
    } else {
      getUser({ email: manager }, (err, managerObject) => {
        if (err) {
          callback(err);
        } else {
          getManagerCallback(managerObject, ownerObject);
        }
      });
    }
  };

  getUserById(userId, getOwnerCallback);
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