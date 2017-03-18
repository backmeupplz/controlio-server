/**
 * Module to send out emails
 *
 * @module emailSender
 * @license MIT
 */

/** Dependencies */
const helper = require('sendgrid').mail;
const sg = require('sendgrid')('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');
const hogan = require('hogan.js');
const path = require('path');
const fs = require('fs');

/** Load email templates */
const emailResetRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-reset.hjs'), 'utf8');
const emailResetPasswordTemplate = hogan.compile(emailResetRawHtml);

const emailMagicRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-magic-link.hjs'), 'utf8');
const emailMagicLinkTemplate = hogan.compile(emailMagicRawHtml);

const emailSetRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-set.hjs'), 'utf8');
const emailSetPasswordTemplate = hogan.compile(emailSetRawHtml);
/**
 * Some email templates for invites
 * C - Client, M - manager, OC - owner-client, OM - owner-manager
 */
const emailsendInviteAsCRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-invited-as-c.hjs'), 'utf8');
const emailsendInviteAsCTemplate = hogan.compile(emailsendInviteAsCRawHtml);

const emailsendInviteAsMRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-invited-as-m.hjs'), 'utf8');
const emailsendInviteAsMTemplate = hogan.compile(emailsendInviteAsMRawHtml);

const emailsendInviteAsOCRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-invited-as-oc.hjs'), 'utf8');
const emailsendInviteAsOCTemplate = hogan.compile(emailsendInviteAsOCRawHtml);

const emailsendInviteAsOMRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-invited-as-om.hjs'), 'utf8');
const emailsendInviteAsOMTemplate = hogan.compile(emailsendInviteAsOMRawHtml);

/**
 * Function to send reset password email
 * @param {Mongo:User} user user that should get an email
 */
function sendResetPassword(user) {
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(user.email);
  const subject = 'Controlio: reset your password';
  const content = new helper.Content('text/html', emailResetPasswordTemplate.render({ userid: user._id, token: user.tokenForPasswordReset }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

/**
 * Function to send set password email
 * @param {Mongo:User} user user that should get an email
 */
function sendSetPassword(user) {
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(user.email);
  const subject = 'Controlio: set your password';
  const content = new helper.Content('text/html', emailSetPasswordTemplate.render({ userid: user._id, token: user.tokenForPasswordReset }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

/**
 * Function to send magic link email
 * @param {Mongo:User} user user that should get an email
 */
function sendMagicLink(user) {
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(user.email);
  const subject = 'Controlio: your magic link';
  const content = new helper.Content('text/html', emailMagicLinkTemplate.render({ userid: user._id, token: user.magicToken }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

/**
 * Function to send invite to client
 * @param {Mongo:User} user user that should get an email
 */
function sendInviteAsC(email, project) {
  const projectDescription = project.description || 'Without description';
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(email);
  const subject = 'Controlio: your invite';
  const content = new helper.Content('text/html', emailsendInviteAsCTemplate.render({ projectName: project.title, project_id: project._id, description: projectDescription }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

/**
 * Function to send invite to manager
 * @param {Mongo:User} user user that should get an email
 */
function sendInviteAsM(email, project) {
  const projectDescription = project.description || 'Without description';
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(email);
  const subject = 'Controlio: your invite';
  const content = new helper.Content('text/html', emailsendInviteAsMTemplate.render({ projectName: project.title, project_id: project._id, description: projectDescription }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

/**
 * Function to send invite to owner-client
 * @param {Mongo:User} user user that should get an email
 */
function sendInviteAsOC(email, project) {
  const projectDescription = project.description || 'Without description';
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(email);
  const subject = 'Controlio: you created a project';
  const content = new helper.Content('text/html', emailsendInviteAsOCTemplate.render({ projectName: project.title, project_id: project._id, description: projectDescription }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

/**
 * Function to send invite to owner-manager
 * @param {Mongo:User} user user that should get an email
 */
function sendInviteAsOM(email, project) {
  const projectDescription = project.description || 'Without description';
  const fromEmail = new helper.Email('noreply@controlio.co');
  const toEmail = new helper.Email(email);
  const subject = 'Controlio: you created a project';
  const content = new helper.Content('text/html', emailsendInviteAsOMTemplate.render({ projectName: project.title, project_id: project._id, description: projectDescription }));
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request);
}

/** Exports */
module.exports = {
  sendResetPassword,
  sendSetPassword,
  sendMagicLink,
  sendInviteAsC,
  sendInviteAsM,
  sendInviteAsOC,
  sendInviteAsOM,
};
