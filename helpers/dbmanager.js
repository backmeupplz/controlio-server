var mongoose = require('mongoose');

// Get schemas
var User = mongoose.model('user');
var Project = mongoose.model('project');
var Post = mongoose.model('post');

// Users

var getUsers = function(callback) {
  User.find(callback);
}

// DEBUG

var createFakeUser = function(callback) {
  var newUser = new User({
    name: 'Debug User',
    email: 'nikita@borodutch.com',
    phone: '+1 778 288 1444',
    isBusiness: true,
    isCompleted: false,
    isEmailVerified: true,
    projects: []
  });
  newUser.save(callback);
};

// Export

module.exports = {
  getUsers: getUsers,
  debug: {
    createFakeUser: createFakeUser
  }
};