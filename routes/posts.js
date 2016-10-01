const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const errors = require('../helpers/errors');
const validate = require('express-validation');
const validation = require('../validation/posts');

const router = express.Router();

// Private API

router.use(auth.checkToken);

router.post('/', validate(validation.post), (req, res, next) => {
  const projectId = req.body.projectid;
  const text = req.body.text;
  const attachments = req.body.attachments;

  dbmanager.addPost(projectId, text, attachments)
    .then(project => res.send(project))
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  const projectId = req.query.projectId;
  const skip = req.query.skip || 0;
  const limit = req.query.limit || 20;

  if (!projectId) {
    next(errors.fieldNotFound('project id', 500));
    return;
  }

  dbmanager.getPosts(projectId, skip, limit)
    .then(posts => {
      res.send(posts);
    })
    .catch(err => {
      next(err);
    });
});

// Export

module.exports = router;