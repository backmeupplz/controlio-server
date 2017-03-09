/**
 * Telegram bot that sends crucial logs
 *
 * @module botReporter
 * @license MIT
 */

/** Dependencies */
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

const jarvis = new TelegramBot(config.telegramKey, { polling: false });

/** General */

function reportError(err, req) {
  const bannedURLs = ['nikita', 'n1kita', 'khoapham', '162.243.76.239', 'maroonpaymentsystems', 'maroonpay', 'healthepaymentservices', '162.243.82.122'];
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  if (!checkIfBanned(fullUrl, bannedURLs)) {
    sendMessage(`❗ *Error!*\n${'```'}json\n${fullUrl} – ${req.method}\nheaders: ${JSON.stringify(req.headers, null, 2)}\nbody: ${JSON.stringify(req.body, null, 2)}\n${JSON.stringify(err, null, 2)}${'```'}`);
  }
}

function checkIfBanned(fullURL, bannedURLs) {
  let isBannedURL = false;
  bannedURLs.forEach((bannedURL) => {
    if (fullURL.toLowerCase().indexOf(bannedURL) > -1) {
      isBannedURL = true;
    }
  });
  return isBannedURL;
}

/** Users.js */

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
  sendMessage(`👤 Somebody requested profile of *${email}*`);
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

/** Public.js */

function reportGetResetPassword(email) {
  sendMessage(`👀 *${email}* viewed reset password page`);
}

function reportResetPassword(email) {
  sendMessage(`🗝 *${email}* has reset password`);
}

/** Projects.js */

function reportCreateProject(user, project) {
  const clientEmailsString = project.clients.map(client => client.email).join(', ');
  sendMessage(`📝 *${user.email}* created project: *${project.title}* with clients:\n${clientEmailsString}`);
}

function reportGetProjects(user, skip, limit) {
  sendMessage(`📄 *${user.email}* requested a list of projects (${skip}, ${limit})`);
}

function reportChangeClients(project) {
  sendMessage(`👨‍👨‍👦 Clients have changed:\n${'```'}json\n${JSON.stringify(project, null, 2)}${'```'}`);
}

function reportEditProject(project) {
  sendMessage(`✒️ Project has been editted:\n${'```'}json\n${JSON.stringify(project, null, 2)}${'```'}`);
}

function reportArchiveProject(user, project, archived) {
  if (archived) {
    sendMessage(`💩 *${user.email}* archived *${project.title}*`);
  } else {
    sendMessage(`💩 *${user.email}* unarchived *${project.title}*`);
  }
}

function reportDeleteProject(user, project) {
  sendMessage(`☠️ *${user.email}* deleted *${project.title}*`);
}

/** Posts.js */

function reportAddPost(user, project, post) {
  const attachmentsString = post.attachments.join(', ');
  sendMessage(`🙌 *${user.email}* added post to *${project.title}*:\n*${post.text}*\n${attachmentsString}`);
}

function reportChangeStatus(user, project, post) {
  sendMessage(`✈️ *${user.email}* changed status of *${project.title}* to *${post.text}*`);
}

function reportGetPosts(projectid, skip, limit) {
  sendMessage(`🚧 Somebody requested a list of posts for ${projectid} (${skip}, ${limit})`);
}

function reportEditPost(user, post) {
  sendMessage(`🖊 *${user.email}* eddited post:\n${'```'}json\n${JSON.stringify(post, null, 2)}${'```'}`);
}

function reportDeletePost(user, post, project) {
  sendMessage(`👺 *${user.email}* deleted ${post.type} *${post.text}* from *${project.title}*`);
}

/** Payments.js */

function reportChangeSubscription(user, planid) {
  let planTitle = '';
  if (planid === 0) {
    planTitle = 'Free';
  } else if (planid === 1) {
    planTitle = '$20/month';
  } else if (planid === 2) {
    planTitle = '$50/month';
  } else if (planid === 3) {
    planTitle = '$100/month';
  }
  sendMessage(`💰 *${user.email}* changed subscription to *${planTitle}*`);
}

function reportRedeemCoupon(user, couponid) {
  sendMessage(`💎 *${user.email}* redeemed coupon *${couponid}*`);
}

/** General functions */

function sendMessage(msg) {
  if (config.telegramKey) {
    /** TODO: enable bot reporter */
    // jarvis.sendMessage(config.telegramLogsId, msg, { parse_mode: 'Markdown' });
  }
}

/** Exports */
module.exports = {
  /** General */
  reportError,
  /** Users.js */
  reportMagicLinkRequest,
  reportMagicLinkLogin,
  reportLogin,
  reportSignUp,
  reportPasswordResetRequest,
  reportLogout,
  reportGetProfile,
  reportEditProfile,
  reportAddManager,
  reportGetManagers,
  reportDeleteManager,
  /** Public.js */
  reportGetResetPassword,
  reportResetPassword,
  /** Projects.js */
  reportCreateProject,
  reportGetProjects,
  reportChangeStatus,
  reportChangeClients,
  reportEditProject,
  reportArchiveProject,
  reportDeleteProject,
  /** Posts.js */
  reportAddPost,
  reportGetPosts,
  reportEditPost,
  reportDeletePost,
  /** Payments.js */
  reportChangeSubscription,
  reportRedeemCoupon,
};
