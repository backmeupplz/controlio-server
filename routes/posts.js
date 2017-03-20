/** Dependencies */
const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/posts');
const botReporter = require('../helpers/botReporter');

const router = express.Router();

/** Private API check */
router.use(auth.checkToken);

/** Method to add new post to the database */
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

/** Method to get a list of posts for the project */
router.get('/', validate(validation.get), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.query.projectid;
  const skip = parseInt(req.query.skip || 0, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  dbmanager.getPosts(userId, projectId, skip, limit)
    .then(posts => res.send(posts))
    .catch(err => next(err));
});

/** Method to edit a post */
router.put('/', validate(validation.put), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const postId = req.body.postid;
  const text = req.body.text;
  const attachments = req.body.attachments;

  dbmanager.editPost(userId, projectId, postId, text, attachments)
    .then(post => res.send(post))
    .catch(err => next(err));
});

/** Method to delete the post */
router.delete('/', validate(validation.delete), (req, res, next) => {
  const userId = req.get('userId');
  const projectId = req.body.projectid;
  const postId = req.body.postid;

  dbmanager.deletePost(userId, projectId, postId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Export */
module.exports = router;
