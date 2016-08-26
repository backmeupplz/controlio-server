const express = require('express');
const router = express.Router();
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const errors = require('../helpers/errors');

// Private API

router.use(auth.checkToken);

router.post('/', (req, res, next) => {
  // if (requestValidator.checkParams(['projectId', 'text', 'attachments'], req, next)) { return }
  
  const projectId = req.body.projectId;
  const text = req.body.text;
  const attachments = req.body.attachments;
  
  dbmanager.addPost(projectId, text, attachments)
    .then(project => {
      res.sendStatus(200);
    })
    .catch(err => {
      next(err);
    });
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