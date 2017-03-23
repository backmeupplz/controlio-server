/**
 * Module to send out emails
 *
 * @module emailSender
 * @license MIT
 */

/** Dependencies */
const helper = require('sendgrid').mail;
const config = require('../config');
const sg = require('sendgrid')(config.sendgridApiKey);
const path = require('path');
const EmailTemplate = require('email-templates').EmailTemplate;
const juice = require('juice');

const templateDir = path.join(__dirname, '..', 'views', 'templates', 'email');
const emailTemplate = new EmailTemplate(templateDir);

/**
 * Function to send reset password email
 * @param {Mongo:User} user user that should get an email
 */
function sendResetPassword(user) {
  const data = {
    button_title: 'Set new password',
    button_url: `https://api.controlio.co/public/resetPassword?userid=${user._id}&token=${user.tokenForPasswordReset}`,
    texts: [
      'Hello there! Somebody requested us to send you the link to reset your password at Controlio. Please hit the button below to set new password.',
      'If it wasn\'t you who requested reset, please ignore this email.',
    ],
  };

  sendEmail(data, 'Controlio: reset your password', user.email);
}

/**
 * Function to send set password email
 * @param {Mongo:User} user user that should get an email
 */
function sendSetPassword(user) {
  const data = {
    button_title: 'Set new password',
    button_url: `https://api.controlio.co/public/setPassword?userid=${user._id}&token=${user.tokenForPasswordReset}`,
    texts: [
      'Hello there! Somebody has invited you to Controlio and you need to set the password for your account. Please do so by clicking the button below.',
    ],
  };

  sendEmail(data, 'Controlio: set your password', user.email);
}

/**
 * Function to send magic link email
 * @param {Mongo:User} user user that should get an email
 */
function sendMagicLink(user) {
  const data = {
    button_title: 'Login to Controlio',
    button_url: `https://api.controlio.co/magic?userid=${user._id}&token=${user.magicToken}`,
    texts: [
      'Click the button below to login to Controlio. Yeah, we know, as simple as that.',
    ],
  };

  sendEmail(data, 'Controlio: your magic link', user.email);
}

/**
 * Function to send invite to client
 * @param {Mongo:User} user user that should get an email
 * @param {String} type Type of invite ('client', 'manager' or 'owner')
 */
function sendInvite(email, project, type) {
  let inviteMessage;
  switch (type) {
    case 'client':
      inviteMessage = `Somebody has invited you to "${project.name}" as a client.`;
      break;
    case 'manager':
      inviteMessage = `Somebody has invited you to "${project.name}" as a manager.`;
      break;
    default:
      inviteMessage = `Somebody has invited you to "${project.name}" as an owner.`;
      break;
  }

  const data = {
    button_title: 'Install Controlio',
    button_url: 'https://itunes.apple.com/ca/app/controlio/id997857994',
    texts: [
      'Congratulations!',
      inviteMessage,
      `${project.title}:`,
      project.description,
      'You can install Controlio following the link below.',
    ],
  };

  sendEmail(data, 'Controlio: your magic link', email);
}

/**
 * Function to send signup email
 */

function sendSignup(email) {
  const data = {
    button_title: 'about controlio',
    button_url: 'https://controlio.co',
    texts: [
      'Welcome to controlio!',
      ],
    };
  
  sendEmail(data, 'Controlio: welcome to family', email);
}
/**
 * Function to send email
 * @param {Object} data Object with all required data to render email
 * @param {String} subject Subject of the email
 * @param {String(Email)} receiver Email of the receiver
 */
function sendEmail(data, subject, receiver) {
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(receiver);
  data.title = subject;

  emailTemplate.render(data, (err, result) => {
    /** todo: handle error */
    juice.juiceResources(result.html, {}, (error, html) => {
      /** todo: handle error */
      result.html = html;
      const content = new helper.Content('text/html', result.html);
      const mail = new helper.Mail(fromEmail, subject, toEmail, content);

      const request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON(),
      });

      sg.API(request);
    });
  });
}

/** Exports */
module.exports = {
  sendResetPassword,
  sendSetPassword,
  sendMagicLink,
  sendInvite,
  sendSignup,
  sendEmail,
};
