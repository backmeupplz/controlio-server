const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/posts');
const botReporter = require('../helpers/botReporter');
const pushNotifications = require('../helpers/pushNotifications');

const router = express.Router();

// Private API

router.use(auth.checkToken);

router.post('/', validate(validation.post), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const text = req.body.text;
  const attachments = req.body.attachments;
  const type = req.body.type || 'post';

  dbmanager.addPost(userId, projectId, text, attachments, type)
    .then((post) => {
      res.send(post);
    })
    .catch(err => next(err));
});

router.get('/', (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.query.projectId;
  const skip = parseInt(req.query.skip || 0, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  botReporter.reportGetPosts(projectId, skip, limit);

  dbmanager.getPosts(userId, projectId, skip, limit)
    .then(posts => res.send(posts))
    .catch(err => next(err));
});

router.put('/', validate(validation.put), (req, res, next) => {
  const userId = req.get('userId');
  const postId = req.body.postid;
  const text = req.body.text;
  const attachments = req.body.attachments;

  // botReporter works inside dbmanager
  dbmanager.editPost(userId, postId, text, attachments)
    .then(post => res.send(post))
    .catch(err => next(err));
});

router.delete('/', validate(validation.delete), (req, res, next) => {
  const userId = req.get('userId');
  const postId = req.body.postid;

  // botReporter works inside dbmanager
  dbmanager.deletePost(userId, postId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

// Export

module.exports = router;
