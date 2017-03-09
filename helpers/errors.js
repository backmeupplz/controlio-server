/**
 * Module to generate errors
 *
 * @module errors
 * @license MIT
 */

/**
 * Error factory
 * @param {Number} status Status number of the error
 * @param {String} message Message of the error
 * @return {Error} Resulting error
 */
function error(status, message) {
  const err = new Error();
  err.message = message;
  err.status = status;
  return err;
}

/** Methods to generate various errors */

function notFound() {
  return error(404, 'Not found');
}
function noAccess() {
  return error(403, 'No access');
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
function noPostFound() {
  return error(400, 'No post found');
}
function noInviteFound() {
  return error(400, 'No invite found');
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
function removeYourselfAsManager() {
  return error(403, 'You cannot remove yourself as a manager');
}
function userNotManager() {
  return error(403, 'This user is not your manager');
}
function fieldNotFound(field) {
  return error(403, `Field '${field}' not found`);
}
function leaveAsOwner() {
  return error(403, 'You cannot leave the project as an owner');
}
function managersOverLimit() {
  return error(403, 'This project has reached it\'s manager limits');
}
function usersOverLimit() {
  return error(403, 'This project has reached it\'s users limits');
}
function notEnoughProjectsOnPlan(maxNumberOfProjects) {
  let projectWord = 'projects';
  if (maxNumberOfProjects === 1) {
    projectWord = 'project';
  }
  return error(403, `Your plan only includes ${maxNumberOfProjects} ${projectWord}. Please upgrade your plan in settings or archive or delete older projects.`);
}

function standardize(originalError) {
  const resultError = new Error();
  resultError.status = originalError.status || 500;
  resultError.message = originalError.message || 'Oops! Something went wrong';
  return resultError;
}

/** Exports */
module.exports = {
  notFound,
  noAccess,
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
  noPostFound,
  noInviteFound,
  notAuthorized,
  magicLinkOnlyOnce,
  addDemoAsClient,
  addDemoAsManager,
  removeYourselfAsManager,
  userNotManager,
  leaveAsOwner,
  notEnoughProjectsOnPlan,
  fieldNotFound,
  standardize,
};
