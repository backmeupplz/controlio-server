const express = require('express');
const router = express.Router();
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/projects');

// Private API

router.use(auth.checkToken);

router.post('/', validate(validation.post), (req, res, next) => {
  const userId = req.get('userId');
  const title = req.body.title;
  const image = req.body.image;
  const status = req.body.status;
  const description = req.body.description;
  const manager = req.body.manager;
  const clients = req.body.clients;

  dbmanager.addProject(userId, title, image, status, description, manager, clients)
    .then(project => {
      res.send(project);
    })
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  const userId = req.get('userId');
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 20;
  dbmanager.getProjects(userId, skip, limit)
    .then(projects => {
      res.send(projects);
    })
    .catch(err => next(err));
});

// Export

module.exports = router;