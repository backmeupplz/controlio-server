var mongoose = require('mongoose');

// Get schemas
var User = mongoose.model('user');
var Project = mongoose.model('project');
var Post = mongoose.model('post');

// Users

var getUsers = function(callback) {
  User.find(callback);
};

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
  var findUserCallback = function(err, dbuser) {
    if (err) {
      callback(err);
    } else {
      if (dbuser) {
        var err = new Error();
        err.message = 'User already exists';
        callback(err);
      } else {
        var newUser = new User(user);
        newUser.save(callback);
      }
    }
  };
  User.findOne({email: user.email}, findUserCallback);
};

var addUserByEmail = function(email, callback) {
  var user = {
    email: email,
    addedAsClient: true
  };
  var newUser = new User(user);
  newUser.save(callback)
};

var getUser = function(options, callback, select) {
  if (select) {
    User.findOne(options).select(select).exec(callback);
  } else {
    User.findOne(options).exec(callback);
  }
};

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

var addProject = function(project, callback) {
  var newProject = new Project(project);
  newProject.save(callback);
};

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

var getPosts = function(email, callback) {
  
};

// DEBUG

var removeAllUsers = function(callback) {
  User.remove({}, callback);
};

// Export

module.exports = {
  getUsers: getUsers,
  addUser: addUser,
  addUserByEmail: addUserByEmail,
  getUser: getUser,
  getClients: getClients,
  addProject: addProject,
  getProjects: getProjects,
  getPosts: getPosts,
  debug: {
    removeAllUsers: removeAllUsers
  }
};