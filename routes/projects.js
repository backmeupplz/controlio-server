var express = require('express');
var router = express.Router();
var dbmanager = rootRequire('helpers/dbmanager');
var auth = rootRequire('helpers/auth');

// Private API

router.use(auth.checkToken);

router.post('/getprojects', function(req, res) {
  var email = req.body.email;
  dbmanager.getPosts(email, function(err, posts) {
    if (err) {
      res.send(err);
    } else {
      res.send(posts);
    }
  });
});

// DEBUG

router.get('/removeallprojects', function(req, res, next) {
  dbmanager.debug.removeAllUsers(function(err) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(200);
    }
  });
});

// Export

module.exports = router;