const helper = require('sendgrid').mail;
const sg = require('sendgrid')('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');
const hogan = require('hogan.js');
const path = require('path');
const fs = require('fs');

const emailResetRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-reset.hjs'), 'utf8');
const emailResetPasswordTemplate = hogan.compile(emailResetRawHtml);

const emailMagicRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-magic-link.hjs'), 'utf8');
const emailMagicLinkTemplate = hogan.compile(emailMagicRawHtml);

function sendResetPassword(user, token) {
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(user.email);
  const subject = 'Controlio: reset your password';
  const content = new helper.Content('text/html', emailResetPasswordTemplate.render({ token }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

function sendMagicLink(user, token) {
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(user.email);
  const subject = 'Controlio: your magic link';
  const content = new helper.Content('text/html', emailMagicLinkTemplate.render({ token }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

module.exports = {
  sendResetPassword,
  sendMagicLink,
}