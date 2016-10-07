const TelegramBot = require('node-telegram-bot-api');

// Setup

const jarvis = new TelegramBot('237463370:AAFI2qe2SEaTIb5kQ_Es5ny5vccdh84pwfQ', { polling: true });

// General

function reportError(err, req) {
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  sendMessage(`❗ *Error!*\n${'```'}json\n${fullUrl} – ${req.method}\nbody: ${JSON.stringify(req.body, null, 2)}\n${JSON.stringify(err, null, 2)}${'```'}`);
}

// Users.js

function reportMagicLinkRequest(email) {
  sendMessage(`🎩 *${email}* requested magic link`);
}

function reportMagicLinkLogin(email) {
  sendMessage(`🎩 *${email}* logged in with magic link`);
}

function reportLogin(email) {
  sendMessage(`🔑 *${email}* logged in`);
}

function reportSignUp(email) {
  sendMessage(`➕ *${email}* signed up`);
}

function reportPasswordResetRequest(email) {
  sendMessage(`❓ *${email}* requested password reset`);
}

function reportLogout(email) {
  sendMessage(`✋ *${email}* logged out`);
}

function reportGetProfile(email) {
  sendMessage(`👤 *${email}* requested profile`);
}

function reportEditProfile(user) {
  sendMessage(`✏️ *${user.email}* edited profile:\n${'```'}json\n${JSON.stringify(user, null, 2)}${'```'}`);
}

function reportAddManager(owner, manager) {
  sendMessage(`👷 *${owner.email}* added *${manager.email}* as a manager`);
}

function reportGetManagers(email) {
  sendMessage(`🐝 *${email}* requested a list of managers`);
}

function reportDeleteManager(owner, manager) {
  sendMessage(`❌ *${owner.email}* deleted *${manager.email}* as a manager`);
}

// Public.js

function reportGetResetPassword(email) {
  sendMessage(`👀 *${email}* viewed reset password page`);
}

function reportResetPassword(email) {
  sendMessage(`🗝 *${email}* has reset password`);
}

// Projects.js

function reportCreateProject(user, project) {
  sendMessage(`📝 *${user.email}* created project:\n${'```'}json\n${JSON.stringify(project, null, 2)}${'```'}`);
}

function reportGetProjects(user, skip, limit) {
  sendMessage(`📄 *${user.email}* requested a list of projects (${skip}, ${limit})`);
}

function reportChangeStatus(project) {
  sendMessage(`✈️ Project status has changed:\n${'```'}json\n${JSON.stringify(project, null, 2)}${'```'}`);
}

function reportChangeClients(project) {
  sendMessage(`👨‍👨‍👦 Clients have changed:\n${'```'}json\n${JSON.stringify(project, null, 2)}${'```'}`);
}

function reportEditProject(project) {
  sendMessage(`✒️ Project has been editted:\n${'```'}json\n${JSON.stringify(project, null, 2)}${'```'}`);
}

// Posts.js

function reportAddPost(user, project, post) {
  sendMessage(`🙌 *${user.email}* added post to *${project.title}*:\n${'```'}json\n${JSON.stringify(post, null, 2)}${'```'}`);
}

function reportGetPosts(projectid, skip, limit) {
  sendMessage(`🚧 Somebody requested a list of posts for ${projectid} (${skip}, ${limit})`);
}

function reportEditPost(user, post) {
  sendMessage(`🖊 *${user.email}* eddited post:\n${'```'}json\n${JSON.stringify(post, null, 2)}${'```'}`);
}

function reportDeletePost(user, post) {
  sendMessage(`👺 *${user.email}* delited post:\n${'```'}json\n${JSON.stringify(post, null, 2)}${'```'}`);
}

// General functions

function sendMessage(msg) {
  jarvis.sendMessage('-170407631', msg, { parse_mode: 'Markdown' });
}

module.exports = {
  // General
  reportError,
  // Users.js
  reportMagicLinkRequest, //
  reportMagicLinkLogin, //
  reportLogin, //
  reportSignUp, //
  reportPasswordResetRequest, //
  reportLogout, //
  reportGetProfile, //
  reportEditProfile, //
  reportAddManager, 
  reportGetManagers, //
  reportDeleteManager,
  // Public.js
  reportGetResetPassword, //
  reportResetPassword, //
  // Projects.js
  reportCreateProject,
  reportGetProjects, //
  reportChangeStatus,
  reportChangeClients,
  reportEditProject,
  // Posts.js
  reportAddPost,
  reportGetPosts,
  reportEditPost,
  reportDeletePost,
};
