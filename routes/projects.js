const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/projects');
const errors = require('../helpers/errors');
const _ = require('lodash');

const router = express.Router();

// Private API

router.use(auth.checkToken);

router.post('/', validate(validation.post), (req, res, next) => {
  const project = _.clone(req.body);
  project.userId = req.get('userId');
  if (project.managerEmail) {
    project.managerEmail = project.managerEmail.toLowerCase();
  }
  if (req.body.clientEmails) {
    project.clientEmails = _.uniq(req.body.clientEmails.map(email => email.toLowerCase()));
  }
  dbmanager.addProject(project)
    .then(dbproject => res.send(dbproject))
    .catch(err => next(err));
});

router.get('/project', validate(validation.getProject), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.query.projectid;

  dbmanager.getProject(userId, projectId)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  const userId = req.get('userId');
  const skip = parseInt(req.query.skip || 0, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  dbmanager.getProjects(userId, skip, limit)
    .then(projects => res.send(projects))
    .catch(err => next(err));
});

router.get('/invites', (req, res, next) => {
  const userId = req.get('userId');
  dbmanager.getInvites(userId)
    .then(invites => res.send(invites))
    .catch(err => next(err));
});

router.post('/invite', validate(validation.postInvite), (req, res, next) => {
  const userId = req.get('userId');
  const inviteId = req.body.inviteId;
  const accept = req.body.accept;

  dbmanager.acceptInvite(userId, inviteId, accept)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

router.delete('/invite', (req, res, next) => {
  const userId = req.get('userId');
  const inviteId = req.body.inviteId;

  dbmanager.removeInvite(userId, inviteId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

router.delete('/manager', (req, res, next) => {
  const userId = req.get('userId');
  const managerId = req.body.managerId;
  const projectId = req.body.projectId;

  dbmanager.removeManager(userId, managerId, projectId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

router.delete('/client', (req, res, next) => {
  const userId = req.get('userId');
  const clientId = req.body.clientId;
  const projectId = req.body.projectId;

  dbmanager.removeClient(userId, clientId, projectId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Not yet checked */

router.post('/clients', validate(validation.postClients), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const clients = _.uniq(req.body.clients.map(email => email.toLowerCase()));

  if (clients.includes('giraffe@controlio.co')) {
    next(errors.addDemoAsClient());
    return;
  }

  // botReporter works inside dbmanager
  dbmanager.changeClients(userId, projectId, clients)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.put('/', validate(validation.put), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const title = req.body.title;
  const description = req.body.description;
  const image = req.body.image;

  // botReporter works inside dbmanager
  dbmanager.editProject(userId, projectId, title, description, image)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.delete('/', validate(validation.delete), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;

  // botReporter works inside dbmanager
  dbmanager.deleteProject(userId, projectId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

router.post('/archive', validate(validation.archive), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;

  // botReporter works inside dbmanager
  dbmanager.archiveProject(userId, projectId, true)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.post('/unarchive', validate(validation.unarchive), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;

  // botReporter works inside dbmanager
  dbmanager.archiveProject(userId, projectId, false)
    .then(project => res.send(project))
    .catch(err => next(err));
});

// Export

module.exports = router;
