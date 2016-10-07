const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/projects');

const router = express.Router();

// Private API

router.use(auth.checkToken);

router.post('/', validate(validation.post), (req, res, next) => {
  const userId = req.get('userId');
  const title = req.body.title;
  const image = req.body.image;
  const status = req.body.status;
  const description = req.body.description;
  const manager = req.body.manager;
  const clients = req.body.clients.map(email => email.toLowerCase());

  // botReporter works inside dbmanager
  dbmanager.addProject(userId, title, image, status, description, manager, clients)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  const userId = req.get('userId');
  let skip = req.query.skip || 0;
  let limit = req.query.limit || 20;
  skip = parseInt(skip, 10);
  limit = parseInt(limit, 10);

  // botReporter works inside dbmanager
  dbmanager.getProjects(userId, skip, limit)
    .then(projects => res.send(projects))
    .catch(err => next(err));
});

router.post('/status', validate(validation.postStatus), (req, res, next) => {
  const projectId = req.body.projectid;
  const status = req.body.status;

  // botReporter works inside dbmanager
  dbmanager.changeStatus(projectId, status)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.post('/clients', validate(validation.postClients), (req, res, next) => {
  const projectId = req.body.projectid;
  const clients = req.body.clients;

  // botReporter works inside dbmanager
  dbmanager.changeClients(projectId, clients)
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

// Export

module.exports = router;
