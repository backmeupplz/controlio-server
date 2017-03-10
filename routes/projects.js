/** Dependencies */
const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/projects');
const errors = require('../helpers/errors');
const _ = require('lodash');
const validator = require('validator');

const router = express.Router();

/** Private API check */
router.use(auth.checkToken);

/** Method to create a new project */
router.post('/', validate(validation.post), (req, res, next) => {
  const project = _.clone(req.body);
  project.userId = req.get('userId');
  if (project.type === 'client') {
    if (validator.isEmail(project.managerEmail)) {
      project.managerEmail = project.managerEmail.toLowerCase();
    } else {
      next(errors.validManagerEmail());
      return;
    }
  } else if (project.type === 'manager') {
    project.clientEmails = _.uniq(req.body.clientEmails.map(email => email.toLowerCase()))
      .filter(email => validator.isEmail(email));
  }
  dbmanager.addProject(project)
    .then(dbproject => res.send(dbproject))
    .catch(err => next(err));
});

/** Method to get a project by id */
router.get('/project', validate(validation.getProject), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.query.projectid;

  dbmanager.getProject(userId, projectId)
    .then(project => res.send(project))
    .catch(err => next(err));
});

/** Method to get a list of the projects */
router.get('/', validate(validation.getProjects), (req, res, next) => {
  const userId = req.get('userId');
  const skip = parseInt(req.query.skip || 0, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  dbmanager.getProjects(userId, skip, limit)
    .then(projects => res.send(projects))
    .catch(err => next(err));
});

/** Method to get invites to projects for user */
router.get('/invites', (req, res, next) => {
  const userId = req.get('userId');
  dbmanager.getInvites(userId)
    .then(invites => res.send(invites))
    .catch(err => next(err));
});

/** Method to accept or reject invite */
router.post('/invite', validate(validation.postInvite), (req, res, next) => {
  const userId = req.get('userId');
  const inviteId = req.body.inviteid;
  const accept = req.body.accept;

  dbmanager.acceptInvite(userId, inviteId, accept)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Method to delete an invite */
router.delete('/invite', validate(validation.deleteInvite), (req, res, next) => {
  const userId = req.get('userId');
  const inviteId = req.body.inviteid;

  dbmanager.removeInvite(userId, inviteId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Method to add managers */
router.post('/managers', validate(validation.postManagers), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const managers = _.uniq(req.body.managers.map(email => email.toLowerCase()));

  if (managers.includes('giraffe@controlio.co')) {
    next(errors.addDemoAsClient());
    return;
  }

  dbmanager.addManagers(userId, projectId, managers)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Method to delete a manager */
router.delete('/manager', validate(validation.deleteManager), (req, res, next) => {
  const userId = req.get('userId');
  const managerId = req.body.managerid;
  const projectId = req.body.projectid;

  dbmanager.removeManager(userId, managerId, projectId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Method to delete a client */
router.delete('/client', validate(validation.deleteClient), (req, res, next) => {
  const userId = req.get('userId');
  const clientId = req.body.clientid;
  const projectId = req.body.projectid;

  dbmanager.removeClient(userId, clientId, projectId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Method to add clients */
router.post('/clients', validate(validation.postClients), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const clients = _.uniq(req.body.clients.map(email => email.toLowerCase()));

  if (clients.includes('giraffe@controlio.co')) {
    next(errors.addDemoAsClient());
    return;
  }

  dbmanager.addClients(userId, projectId, clients)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Method to edit project */
router.put('/', validate(validation.put), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const title = req.body.title;
  let description = req.body.description;
  if (description && description.length <= 0) {
    description = null;
  }
  const image = req.body.image;

  dbmanager.editProject(userId, projectId, title, description, image)
    .then(project => res.send(project))
    .catch(err => next(err));
});

/** Method to leave project */
router.post('/leave', validate(validation.leave), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;

  dbmanager.leaveProject(userId, projectId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Method to delete project */
router.delete('/', validate(validation.delete), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;

  dbmanager.deleteProject(userId, projectId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** TODO: methods below need refactoring and testing */

/** Method to archive the project */
router.post('/archive', validate(validation.archive), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;

  dbmanager.archiveProject(userId, projectId, true)
    .then(project => res.send(project))
    .catch(err => next(err));
});

/** Method to unarchive the project */
router.post('/unarchive', validate(validation.unarchive), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;

  dbmanager.archiveProject(userId, projectId, false)
    .then(project => res.send(project))
    .catch(err => next(err));
});

/** Export */
module.exports = router;
