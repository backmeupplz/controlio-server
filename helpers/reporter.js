/**
 * Telegram bot that sends crucial logs
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
    sendMessage(`❗ *Error!*\n${'```'}json\n${fullUrl} – ${req.method}\ntoken: ${req.headers.token}\nbody: ${JSON.stringify(req.body, null, 2)}\n${JSON.stringify(err, null, 2)}${'```'}`);
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
  sendMessage(`🎩 \`${user.email}\` requested magic link`);
}


function reportMagicLinkLogin(user) {
  sendMessage(`🎩 \`${user.email}\` logged in with magic link`);
}

function reportSignUp(user) {
  sendMessage(`➕ \`${user.email}\` signed up`);
}

function reportPasswordResetRequest(user) {
  sendMessage(`❓ \`${user.email}\` requested password reset`);
}

function reportLogout(user) {
  sendMessage(`✋ \`${user.email}\` logged out`);
}

function reportEditProfile(user) {
  sendMessage(`✏️  \`${user.email}\` edited profile:\nEmail: \`${user.email}\`\nName: \`${user.name}\`\nPhone: \`${user.phone}\`\nPhoto: \`${user.photo}\``);
}

/** Public.js */

function reportGetResetPassword(user) {
  sendMessage(`👀 \`${user.email}\` viewed reset password page`);
}

function reportResetPassword(user) {
  sendMessage(`🗝 \`${user.email}\` has reset password`);
}

function reportGetSetPassword(user) {
  sendMessage(`👀 \`${user.email}\` has viewed set password page`);
}

function reportSetPassword(user) {
  sendMessage(`🗝 \`${user.email}\` has set password`);
}

/** Projects.js */

function reportGetProjects(user, skip, limit, type, query) {
  sendMessage(`📄 \`${user.email}\` requested a list of projects (\`\`\`${skip}, ${limit}, ${type}, ${query}\`\`\`)`);
}

function reportEditProject(user, project) {
  sendMessage(`✒️  \`${user.email}\` editted project: (${project._id})\nTitle: \`${project.title}\`\nDescription: \`\`\`${project.description}\`\`\``);
}

function reportFinishProject(user, project, finished) {
  if (finished) {
    sendMessage(`💩 \`${user.email}\` finished \`${project.title}\``);
  } else {
    sendMessage(`💩 \`${user.email}\` revived \`${project.title}\``);
  }
}

/** Posts.js */

function reportGetPosts(user, project) {
  sendMessage(`🚧 \`${user.email}\` requested a list of posts for \`${project.title}\``);
}

function reportEditPost(user, post, project) {
  sendMessage(`🖊 \`${user.email}\` eddited post in project \`${project.title}\`:\nType: \`${post.type}\`\nText: \`\`\`${post.text}\`\`\`\nAttachments: \`\`\`${JSON.stringify(post.attachments)}\`\`\``);
}

function reportDeletePost(user, post, project) {
  sendMessage(`👺 \`${user.email}\` deleted \`\`\`${post.type} ${post.text}\`\`\` from \`${project.title}\``);
}

/** Payments.js */

function reportChangeSubscription(user, planid) {
  let planTitle;
  switch (planid) {
    case 0:
      planTitle = 'Free';
      break;
    case 1:
      planTitle = '$20/month';
      break;
    case 2:
      planTitle = '$50/month';
      break;
    case 3:
      planTitle = '$100/month';
      break;
    default:
      planTitle = 'undefined plan';
  }
  sendMessage(`💰 \`${user.email}\` changed subscription to \`${planTitle}\``);
}

function reportRedeemCoupon(user, coupon) {
  sendMessage(`💎 \`${user.email}\` redeemed coupon \`${coupon}\``);
}

/** General functions */

function sendMessage(msg) {
  if (config.telegramKey) {
    jarvis.sendMessage(config.telegramLogsId, msg, { parse_mode: 'Markdown' })
      .then(() => {})
      .catch(() => {});
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
  reportFinishProject,
  /** Posts.js */
  reportGetPosts,
  reportEditPost,
  reportDeletePost,
  /** Payments.js */
  reportChangeSubscription,
  reportRedeemCoupon,
};
