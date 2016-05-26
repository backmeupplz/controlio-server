var express = require('express');
var router = express.Router();
var dbmanager = rootRequire('helpers/dbmanager');
var hash = rootRequire('helpers/hash');
var jwt = require('jsonwebtoken');
var config = rootRequire('config');

router.post('/login', function(req, res) {
  var email = req.body.email;
  var rawPassword = req.body.password;

  var getUserCallback = function(err, user) {
    if (err) {
      res.send(err);
    } else if (user) {
      if (hash.checkPassword(user.password, rawPassword)) {
        user.password = undefined;
        res.send(user);
      } else {
        var err = new Error();
        err.message = 'Authentication failed. Wrong password.';
        res.send(err);
      }
    } else {
      var err = new Error();
      err.message = 'User not found';
      res.send(err);
    }
  };

  dbmanager.getUser({email: email}, getUserCallback, '+password +token');
});

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
  var email = req.body.email;
  var rawPassword = req.body.password;

  var addUserCallback = function(err, user) {
    if (err) {
      res.send(err);
    } else {
      user.password = undefined;
      res.send(user);
    }
  };

  var hashPass = hash.hashPassword(rawPassword);

  if (hashPass) {
    var user = {
      email: email,
      password: hashPass,
      token: jwt.sign(email, config.secret)
    };

    dbmanager.addUser(user, addUserCallback);
  } else {
    res.send(new Error());
  }
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