var mongoose = require('mongoose');

// Get schemas
var User = mongoose.model('user');
var Project = mongoose.model('project');
var Post = mongoose.model('post');

// Users

var getUsers = function(callback) {
  User.find(callback);
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

var getUser = function(options, callback, select) {
  if (select) {
    User.findOne(options).select(select).exec(callback);
  } else {
    User.findOne(options).exec(callback);
  }
};

// DEBUG

var removeAllUsers = function(callback) {
  User.remove({}, callback);
};

// Export

module.exports = {
  getUsers: getUsers,
  addUser: addUser,
  getUser: getUser,
  debug: {
    removeAllUsers: removeAllUsers
  }
};