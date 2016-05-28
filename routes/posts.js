var express = require('express');
var router = express.Router();
var dbmanager = rootRequire('helpers/dbmanager');
var auth = rootRequire('helpers/auth');

// Private API

router.use(auth.checkToken);

router.post('/getposts', function(req, res) {
  res.sendStatus(501);
  // var email = req.body.email;
  // dbmanager.getPosts(email, function(err, posts) {
  //   if (err) {
  //     res.send(err);
  //   } else {
  //     res.send(posts);
  //   }
  // });
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