var express = require('express');
var router = express.Router();
var dbmanager = rootRequire('helpers/dbmanager');

router.get('/', function(req, res, next) {
  dbmanager.getUsers(function(err, users) {
    if (err) {
      next(err);
    } else {
      res.send(users);
    }
  });
});

router.get('/addfakeuser', function(req, res, next) {
  dbmanager.debug.createFakeUser(function(err, user) {
    if (err) {
      next(err);
    } else {
      res.send(user);
    }
  });
});

router.use(function(err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

module.exports = router;