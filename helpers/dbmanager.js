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
  var newUser = new User(user);
  newUser.save(callback);
};

// DEBUG

var removeAllUsers = function(callback) {
  User.remove({}, callback);
};

// Export

module.exports = {
  getUsers: getUsers,
  addUser: addUser,
  debug: {
    removeAllUsers: removeAllUsers
  }
};