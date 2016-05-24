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

router.post('/', function(req, res) {
  dbmanager.addUser(req.body, function(err, user) {
    if (err) {
      res.send(err);
    } else {
      res.send(user);
    }
  });
});

// DEBUG

router.get('/removeallusers', function(req, res, next) {
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