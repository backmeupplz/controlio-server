const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
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
  const projectId = req.query.projectid;
  let skip = req.query.skip || 0;
  let limit = req.query.limit || 20;
  skip = parseInt(skip, 10);
  limit = parseInt(limit, 10);

  dbmanager.getPosts(projectId, skip, limit)
    .then(posts => res.send(posts))
    .catch(err => next(err));
});

// Export

module.exports = router;
