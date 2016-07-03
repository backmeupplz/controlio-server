var mongoose = require('mongoose');
var errors = require('./errors.js');
var _ = require('lodash');

// Get schemas
var User = mongoose.model('user');
var Project = mongoose.model('project');
var Post = mongoose.model('post');

// Users

var addUser = function(user, callback) {
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

var getUserById = function(id, callback, select, projection, populate) {
  User.findById(id, projection).select(select || '').populate(populate || '').exec(callback);
};

var getUser = function(options, callback, select) {
  User.findOne(options).select(select || '').exec(callback);
};

// Projects

var addProject = function(req, callback) {
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

var getProjects = function(userId, skip, limit, callback) {
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

var addPost = function(projectId, text, attachments, callback) {
  Project.findById(projectId, function(err, project) {
    if (err) {
      callback(err);
    } else {
      var newPost = {
        text: text,
        manager: project.manager,
        project: project,
        attachments: attachments
      };
      var post = new Post(newPost);
      post.save(function(err, post) {
        if (err) {
          callback(err);
        } else {
          project.posts.push(post);
          project.save(callback);
        }
      });
    }
  });
};

var getPosts = function(projectId, skip, limit, callback) {
  Project.findById(projectId, {posts:{$slice:[skip, limit]}}).populate('posts').exec(function(err, project) {
    if (err) {
      callback(err);
    } else {
      callback(null, project.posts);
    }
  });
};

// Helpers

var addUsersByEmails = function(emails, callback) {
  if (emails.length > 0) {
    var usersToAdd = emails.map(function(email) {
      return userTemplate(email);
    });
    User.create(usersToAdd, callback);
  } else {
    callback(null, [])
  }
};

var userTemplate = function(email) {
  return {
    email: email
  };
};

var getClients = function(clientEmails, callback) {
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
  addUser: addUser,
  getUserById: getUserById,
  getUser: getUser,
  // Projects
  addProject: addProject,
  getProjects: getProjects,
  // Posts
  addPost: addPost,
  getPosts: getPosts
};