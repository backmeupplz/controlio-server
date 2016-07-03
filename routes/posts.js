var express = require('express');
var router = express.Router();
var dbmanager = require('../helpers/dbmanager');
var auth = require('../helpers/auth');

// Private API

router.use(auth.checkToken);

// todo: refactor
router.post('/', function(req, res, next) {
  var projectId = req.body.projectId;
  var text = req.body.text;
  var attachments = req.body.attachments;
  
  if (!(projectId && text && attachments)) {
    next(new Error(500));
    return;
  }
  
  dbmanager.addPost(projectId, text, attachments, function(err) {
    if (err) {
      console.log(err);
      next(err);
    } else {
      res.sendStatus(200);
    }
  })
});

// todo: refactor
router.get('/', function(req, res) {
  var projectId = req.query.projectId;
  var skip = req.query.skip || 0;
  var limit = req.query.limit || 20;

  if (!projectId) {
    next(new Error(500));
    return;
  }

  dbmanager.getPosts(projectId, skip, limit, function(err, posts) {
    if (err) {
      next(err);
    } else {
      res.send(posts);
    }
  });
});

// Export

module.exports = router;