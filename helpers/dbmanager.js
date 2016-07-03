var mongoose = require('mongoose');
var errors = require('./errors.js');

// Get schemas
var User = mongoose.model('user');
var Project = mongoose.model('project');
var Post = mongoose.model('post');

// Users

// todo: refactor
var addUsersByEmails = function(emails, callback) {
  if (emails.length > 0) {
    var usersToAdd = [];
    for (var i in emails) {
      var email = emails[i];

      var user = {
        email: email,
        isBusiness: false,
        isAdmin: false,
        isCompleted: false,
        isEmailVerified: false,
        addedAsClient: true,
        addedAsManager: false,
        projects: [],
        iosPushTokens: [],
        androidPushTokens: []
      };

      usersToAdd.push(user)
    }
    User.collection.insert(usersToAdd, callback)
  } else {
    callback(null, [])
  }
};

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

// todo: refactor
var addUserByEmail = function(email, callback) {
  var user = {
    email: email,
    addedAsClient: true
  };
  var newUser = new User(user);
  newUser.save(callback)
};

var getUserById = function(id, callback, select) {
  User.findById(id).select(select || '').exec(callback);
};

var getUser = function(options, callback, select) {
  User.findOne(options).select(select || '').exec(callback);
};

// todo: refactor
var getClients = function(clientEmails, callback) {
  User.find({'email': {$in: clientEmails} }, function(err, clientObjects) {
    if (err) {
      callback(err)
    } else if (clientObjects) {
      // CHeck what emails aren't created yet
      var clientsEmailsToCreate = [];
      for (var i in clientEmails) {
        var clientEmail = clientEmails[i];
        var shouldAddClientEmail = true;
        for (var j in clientObjects) {
          var clientObject = clientObjects[j];

          if (clientObject.email == clientEmail) {
            shouldAddClientEmail = false;
          }
        }
        if (shouldAddClientEmail) {
          clientsEmailsToCreate.push(clientEmail);
        }
      }
      // Create missing users
      addUsersByEmails(clientsEmailsToCreate, function (err, addedClientObjects) {
        if (err) {
          callback(err)
        } else {
          var allClientObjects = clientObjects.concat(addedClientObjects);
          callback(err, allClientObjects)
        }
      })
    } else {
      callback(new Error(500))
    }
  });
};

// Projects

// todo: refactor
var addProject = function(project, callback) {
  var newProject = new Project(project);
  newProject.save(callback);
};

// todo: refactor
var getProjects = function(userId, skip, limit, callback) {
  getUser({_id: userId}, function(err, user) {
    if (err) {
      callback(err);
    } else if (user) {
      Project.find({
        $or: [
          { managers: user },
          { clients: user}
        ]
      }).skip(skip).limit(limit).populate(['owner', 'manager', 'clients']).exec(callback);
    } else {
      callback(new Error(500));
    }
  });
};

// Posts

// todo: refactor
var addPost = function(projectId, text, attachments, callback) {
  Project.findOne({_id: projectId}, function(err, project) {
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
      post.save(callback);
    }
  });
};

// todo: refactor
var getPosts = function(projectId, skip, limit, callback) {
  Project.findOne({_id: projectId}, function(err, project) {
    if (err) {
      callback(err);
    } else {
      Post.find({project: project})
        .skip(skip)
        .limit(limit)
        .populate('manager')
        .exec(callback);
    }
  });
};

// DEBUG

var removeAllUsers = function(callback) {
  User.remove({}, callback);
};

// Export

module.exports = {
  // Users
  addUser: addUser,
  addUserByEmail: addUserByEmail,
  getUserById: getUserById,
  getUser: getUser,
  getClients: getClients,
  // Projects
  addProject: addProject,
  getProjects: getProjects,
  // Posts
  addPost: addPost,
  getPosts: getPosts,
  debug: {
    removeAllUsers: removeAllUsers
  }
};