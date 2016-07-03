var notFound = function() {
  return error(404, 'Not found');
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
var tokenFailed = function() {
  return error(403, 'Failed to authenticate token');
};
var noApiKey = function() {
  return error(403, 'No API key provided');
};
var fieldNotFound = function(field, status) {
  return error(status || 500, 'No ' + field + ' provided');
};

var error = function(status, msg) {
  var err = new Error();
  err.status = status;
  err.message = msg;
  return err;
};

module.exports = {
  notFound: notFound,
  authEmailNotRegistered: authEmailNotRegistered,
  authWrongPassword: authWrongPassword,
  authHashError: authHashError,
  tokenFailed: tokenFailed,
  noApiKey: noApiKey,
  fieldNotFound: fieldNotFound
};