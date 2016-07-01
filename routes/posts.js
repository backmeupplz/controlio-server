var express = require('express');
var router = express.Router();
var dbmanager = rootRequire('helpers/dbmanager');
var auth = rootRequire('helpers/auth');

// Private API

router.use(auth.checkToken);

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
      next(err);
    } else {
      res.sendStatus(200);
    }
  })
});

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

// DEBUG

router.get('/removeallposts', function(req, res, next) {
  res.sendStatus(501);
  // dbmanager.debug.removeAllUsers(function(err) {
  //   if (err) {
  //     next(err);
  //   } else {
  //     res.sendStatus(200);
  //   }
  // });
});

// Export

module.exports = router;