const mongoose = require('mongoose');
const errors = require('./errors.js');
const _ = require('lodash');

// Get schemas
const User = mongoose.model('user');
const Project = mongoose.model('project');
const Post = mongoose.model('post');

// Users

function addUser(user, callback) {
  var findUserCallback = function(err, databaseUser) {
    if (err) {
      callback(err);
    } else {
      if (databaseUser) {
        callback(errors.authUserAlreadyExists());
      } else {
        var newUser = new User(user);
        newUser.save(callback);
      }
    }
  };
  User.findOne({email: user.email}, findUserCallback);
};

function getUserById(id, callback, select, projection, populate) {
  User.findById(id, projection).select(select || '').populate(populate || '').exec(callback);
};

function getUser(options, callback, select) {
  User.findOne(options).select(select || '').exec(callback);
};

// Projects

function addProject(req, callback) {
  var userId = req.get('x-access-user-id');
  var title = req.body.title;
  var image = req.body.image;
  var status = req.body.status;
  var description = req.body.description;
  var manager = req.body.manager;
  var clients = req.body.clients;

  // Add project

  var getClientsCallback = function(err, clientObjects, managerObject, ownerObject) {
    if (err) {
      callback(err);
    } else if (clientObjects) {
      var project = {
        title: title,
        image: image,
        status: status,
        description: description,
        owner: ownerObject,
        manager: managerObject,
        clients: clientObjects
      };
      var newProject = new Project(project);
      newProject.save(function(err, project) {
        if (err) {
          callback(err);
        } else {
          var allObjects = _.union([ownerObject], [managerObject], clientObjects);
          allObjects.forEach(function (object) {
            object.projects.push(project);
            object.save();
          });
          callback(err);
        }
      });
    } else {
      callback(errors.error(500, 'No client objects created'));
    }
  };

  var getManagerCallback = function(err, managerObject, ownerObject) {
    if (err) {
      callback(err);
    } else if (managerObject) {
      getClients(clients, function(err, clientObjects) {
        getClientsCallback(err, clientObjects, managerObject, ownerObject);
      });
    } else {
      var newManager = {
        email: manager,
        addedAsManager: true
      };
      addUser(newManager, function(err, newManagerObject) {
        getClients(clients, function(err, clientObjects) {
          getClientsCallback(err, clientObjects, newManagerObject, ownerObject);
        });
      });
    }
  };

  var getOwnerCallback = function(err, ownerObject) {
    if (err) {
      callback(err);
    } else if (!ownerObject) {
      callback(errors.error(500, 'No owner found'));
    } else {
      getUser({email: manager}, function(err, managerObject) {
        getManagerCallback(err, managerObject, ownerObject)
      });
    }
  };

  getUserById(userId, getOwnerCallback);
};

function getProjects(userId, skip, limit, callback) {
  getUserById(userId, function(err, user) {
    if (err) {
      callback(err);
    } else if (user) {
      callback(null, user.projects);
    } else {
      callback(errors.error(500, 'No user found'));
    }
  }, null, {projects:{$slice:[skip, limit]}}, 'projects');
};

// Posts

function addPost(projectId, text, attachments, callback) {
  Project.findById(projectId, function(err, project) {
    if (err) {
      callback(err);
    } else {;
      const post = new Post({
        text,
        project,
        attachments,
        manager: project.manager,
      });
      post.save((err, savedPost) => {
        if (err) {
          callback(err);
        } else {
          project.posts.push(savedPost);
          project.save(callback);
        }
      });
    }
  });
};

function getPosts(projectId, skip, limit, callback) {
  Project.findById(projectId, { posts: { $slice: [skip, limit] } })
  .populate('posts')
  .exec((err, project) => {
    if (err) {
      callback(err);
    } else {
      callback(null, project.posts);
    }
  });
};

// Helpers

function addUsersByEmails(emails, callback) {
  if (emails.length > 0) {
    var usersToAdd = emails.map(function(email) {
      return userTemplate(email);
    });
    User.create(usersToAdd, callback);
  } else {
    callback(null, [])
  }
};

function userTemplate(email) {
  return {
    email: email
  };
};

function getClients(clientEmails, callback) {
  User.find({'email': {$in: clientEmails} }, function(err, existingClientObjects) {
    if (err) {
      callback(err);
    } else if (existingClientObjects) {
      // Check what emails aren't created yet
      var existingClientEmails = existingClientObjects.map(function(clientObject) {
        return clientObject.email;
      });
      var clientsEmailsToCreate = _.difference(clientEmails, existingClientEmails);

      // Create missing users
      addUsersByEmails(clientsEmailsToCreate, function (err, addedClientObjects) {
        if (err) {
          callback(err)
        } else {
          var allClientObjects = existingClientObjects.concat(addedClientObjects);
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
  // Projects
  addProject,
  getProjects,
  // Posts
  addPost,
  getPosts
};