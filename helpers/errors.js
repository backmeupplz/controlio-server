function error(status, message) {
  const err = new Error();
  err.message = message;
  err.status = status;
  return err;
}

function notFound() {
  return error(404, 'Not found');
}
function authEmailNotRegistered() {
  return error(403, 'Email not registered');
}
function authWrongPassword() {
  return error(403, 'Wrong password');
}
function authTokenFailed() {
  return error(403, 'Failed to authenticate token');
}
function authUserAlreadyExists() {
  return error(403, 'User already exists');
}
function noApiKey() {
  return error(403, 'No API key provided');
}
function noUserFound() {
  return error(500, 'No user found');
}
function noOwnerFound() {
  return error(500, 'No owner found');
}
function noManagerFound() {
  return error(500, 'No manager found');
}
function noClientObjectsCreated() {
  return error(500, 'No client objects created');
}
function addSelfAsManager() {
  return error(400, 'You cannot add yourself as a manager');
}
function addSelfAsClient() {
  return error(400, 'You cannot add yourself as a client');
}
function alreadyManager() {
  return error(400, 'This user is already a manager');
}
function noProjectFound() {
  return error(400, 'No project found');
}
function notAuthorized() {
  return error(403, 'Not authorized');
}
function magicLinkOnlyOnce() {
  return error(403, 'Magic link can be used only once');
}
function addDemoAsClient() {
  return error(403, 'You cannot add demo account as a client');
}
function addDemoAsManager() {
  return error(403, 'You cannot add demo account as a manager');
}

module.exports = {
  notFound,
  authEmailNotRegistered,
  authWrongPassword,
  authTokenFailed,
  authUserAlreadyExists,
  noApiKey,
  noUserFound,
  noOwnerFound,
  noManagerFound,
  noClientObjectsCreated,
  addSelfAsManager,
  addSelfAsClient,
  alreadyManager,
  noProjectFound,
  notAuthorized,
  magicLinkOnlyOnce,
  addDemoAsClient,
  addDemoAsManager,
};
