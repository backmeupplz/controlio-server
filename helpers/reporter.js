/**
 * Telegram bot that sends crucial logs
 *
 * @module reporter
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

function reportMagicLinkRequest(user) {
  sendMessage(`🎩 *${user.email}* requested magic link. \n\n \`${JSON.stringify(user, null, 2)}\``);
}


function reportMagicLinkLogin(user) {
  sendMessage(`🎩 *${user.email}* logged in with magic link. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

function reportSignUp(user) {
  sendMessage(`➕ *${user.email}* signed up. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

function reportPasswordResetRequest(user) {
  sendMessage(`❓ *${user.email}* requested password reset. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

function reportLogout(user) {
  sendMessage(`✋ *${user.email}* logged out. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

function reportEditProfile(user) {
  sendMessage(`✏️ *${user.email}* edited profile:\n\n \`${JSON.stringify(user, null, 2)}\``);
}

/** Public.js */

function reportGetResetPassword(user) {
  sendMessage(`👀 *${user.email}* viewed reset password page. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

function reportResetPassword(user) {
  sendMessage(`🗝 *${user.email}* has reset password. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

function reportGetSetPassword(user) {
  sendMessage(`👀 *${user.email}* has viewed set password page. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

function reportSetPassword(user) {
  sendMessage(`🗝 *${user.email}* has set password. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

/** Projects.js */

function reportGetProjects(user, skip, limit, type, query) {
  sendMessage(`📄 *${user.email}* requested a list of projects (${skip}, ${limit}, ${type}, ${query})`);
}

function reportEditProject(project) {
  sendMessage(`✒️ Project has been editted:\n\n \`${JSON.stringify(project, null, 2)}\``);
}

function reportArchiveProject(user, project, archived) {
  if (archived) {
    sendMessage(`💩 *${user.email}* archived *${project.title}*. \n\n \`${JSON.stringify(project, null, 2)}\``);
  } else {
    sendMessage(`💩 *${user.email}* unarchived *${project.title}*. \n\n \`${JSON.stringify(project, null, 2)}\``);
  }
}

/** Posts.js */

function reportGetPosts(user, project) {
  sendMessage(`🚧 *${user.email}* requested a list of posts for ${project.title}. \n\n \`${JSON.stringify(project, null, 2)}\``);
}

function reportEditPost(user, post, project) {
  sendMessage(`🖊 *${user.email}* eddited post:\n\n \`${JSON.stringify(post, null, 2)}\`\n\n in project *${project.title}*`);
}

function reportDeletePost(user, post, project) {
  sendMessage(`👺 *${user.email}* deleted ${post.type} *${post.text}* from *${project.title}*. \n\n \`${JSON.stringify(post, null, 2)}\``);
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

function reportRedeemCoupon(user, coupon) {
  sendMessage(`💎 *${user.email}* redeemed coupon *${coupon}*. \n\n \`${JSON.stringify(user, null, 2)}\``);
}

/** General functions */

function sendMessage(msg) {
  if (config.telegramKey) {
    /** TODO: enable bot reporter */
    jarvis.sendMessage(config.telegramLogsId, msg, { parse_mode: 'Markdown' });
  }
}

/** Exports */
module.exports = {
  /** General */
  reportError,
  /** Users.js */
  reportMagicLinkRequest,
  reportMagicLinkLogin,
  reportSignUp,
  reportPasswordResetRequest,
  reportLogout,
  reportEditProfile,
  /** Public.js */
  reportGetResetPassword,
  reportResetPassword,
  reportGetSetPassword,
  reportSetPassword,
  /** Projects.js */
  reportGetProjects,
  reportEditProject,
  reportArchiveProject,
  /** Posts.js */
  reportGetPosts,
  reportEditPost,
  reportDeletePost,
  /** Payments.js */
  reportChangeSubscription,
  reportRedeemCoupon,
};
