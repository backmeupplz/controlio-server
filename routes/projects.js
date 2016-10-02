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
  const managerEmail = req.body.manager;
  const clients = req.body.clients;

  dbmanager.addProject(userId, title, image, status, description, managerEmail, clients)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  const userId = req.get('userId');
  let skip = req.query.skip || 0;
  let limit = req.query.limit || 20;
  skip = parseInt(skip, 10);
  limit = parseInt(limit, 10);
  dbmanager.getProjects(userId, skip, limit)
    .then(projects => res.send(projects))
    .catch(err => next(err));
});

router.post('/status', validate(validation.postStatus), (req, res, next) => {
  const projectId = req.body.projectid;
  const status = req.body.status;

  dbmanager.changeStatus(projectId, status)
    .then(project => res.send(project))
    .catch(err => next(err));
});

// Export

module.exports = router;
