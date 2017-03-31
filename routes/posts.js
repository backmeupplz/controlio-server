/** Dependencies */
const express = require('express');
const db = require('../helpers/db');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/posts');
const demo = require('../helpers/demo');

const router = express.Router();

/** Private API check */
router.use(auth.checkToken);

/** Method to add new post to the database */
router.post('/', validate(validation.post), demo.checkDemo, (req, res, next) => {
  const userId = req.user._id;
  const projectId = req.body.projectid;
  const text = req.body.text;
  const attachments = req.body.attachments;
  const type = req.body.type || 'post';

  db.addPost(userId, projectId, text, attachments, type)
    .then((post) => {
      res.send(post);
    })
    .catch(err => next(err));
});

/** Method to get a list of posts for the project */
router.get('/', validate(validation.get), (req, res, next) => {
  const userId = req.user._id;
  const projectId = req.query.projectid;
  const skip = parseInt(req.query.skip || 0, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  db.getPosts(userId, projectId, skip, limit)
    .then(posts => res.send(posts))
    .catch(err => next(err));
});

/** Method to edit a post */
router.put('/', validate(validation.put), demo.checkDemo, (req, res, next) => {
  const userId = req.user._id;
  const projectId = req.body.projectid;
  const postId = req.body.postid;
  const text = req.body.text;
  const attachments = req.body.attachments;

  db.editPost(userId, projectId, postId, text, attachments)
    .then(post => res.send(post))
    .catch(err => next(err));
});

/** Method to delete the post */
router.delete('/', validate(validation.delete), demo.checkDemo, (req, res, next) => {
  const userId = req.user._id;
  const projectId = req.body.projectid;
  const postId = req.body.postid;

  db.deletePost(userId, projectId, postId)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Export */
module.exports = router;
