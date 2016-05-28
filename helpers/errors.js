var authNoEmail = function() {
  return error(501, 'No email provided');
};
var authNoUserId = function() {
  return error(501, 'No user ID provided');
};
var authNoPassword = function() {
  return error(501, 'No password provided');
};
var authEmailNotRegistered = function() {
  return error(403, 'Email not registered');
};
var authWrongPassword = function() {
  return error(403, 'Wrong password');
};
var authHashError = function() {
  return error(500, 'Password could not be saved');
};
var noTokenProvided = function() {
  return error(403, 'No token provided');
};
var tokenFailed = function() {
  return error(403, 'Failed to authenticate token');
};
var noApiKey = function() {
  return error(403, 'No API key provided');
};

var error = function(status, msg) {
  var err = new Error();
  err.status = status;
  err.message = msg;
  return err;
};

module.exports = {
  authNoEmail: authNoEmail,
  authNoUserId: authNoUserId,
  authNoPassword: authNoPassword,
  authEmailNotRegistered: authEmailNotRegistered,
  authWrongPassword: authWrongPassword,
  authHashError: authHashError,
  noTokenProvided: noTokenProvided,
  tokenFailed: tokenFailed,
  noApiKey: noApiKey
};