function notFound() {
  return error(404, 'Not found');
};
function authEmailNotRegistered() {
  return error(403, 'Email not registered');
};
function authWrongPassword() {
  return error(403, 'Wrong password');
};
function authTokenFailed() {
  return error(403, 'Failed to authenticate token');
};
function authUserAlreadyExists() {
  return error(403, 'User already exists');
};

function noApiKey() {
  return error(403, 'No API key provided');
};

function error(status, msg) {
  const err = new Error();
  err.status = status;
  err.message = msg;
  return err;
};

module.exports = {
  error,
  notFound,
  authEmailNotRegistered,
  authWrongPassword,
  authTokenFailed,
  authUserAlreadyExists,
  noApiKey
};