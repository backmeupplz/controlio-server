var express = require('express');
var router = express.Router();
var dbmanager = require('../helpers/dbmanager');
var hash = require('../helpers/hash');
var jwt = require('jsonwebtoken');
var config = require('../config');
var errors = require('../helpers/errors');
var auth = require('../helpers/auth');

// Public API

router.post('/login', function(req, res, next) {
  var email = req.body.email;
  var rawPassword = req.body.password;

  var getUserCallback = function(err, user) {
    if (err) {
      next(err);
    } else if (user) {
      if (hash.checkPassword(user.password, rawPassword)) {
        user.password = undefined;
        res.send(user);
      } else {
        next(errors.authWrongPassword());
      }
    } else {
      next(errors.authEmailNotRegistered());
    }
  };
  
  if (!email) {
    next(errors.authNoEmail());
  } else if (!rawPassword) {
    next(errors.authNoPassword());
  } else {
    dbmanager.getUser({email: email}, getUserCallback, '+password +token');
  }
});

router.post('/', function(req, res, next) {
  var email = req.body.email;
  var rawPassword = req.body.password;

  var addUserCallback = function(err, user) {
    if (err) {
      next(err);
    } else {
      user.password = undefined;
      res.send(user);
    }
  };

  if (!email) {
    next(errors.authNoEmail());
  } else if (!rawPassword) {
    next(errors.authNoPassword());
  } else {
    var hashPass = hash.hashPassword(rawPassword);

    if (hashPass) {
      var user = {
        email: email,
        password: hashPass,
        token: jwt.sign(email, config.jwtSecret)
      };

      dbmanager.addUser(user, addUserCallback);
    } else {
      next(errors.authHashError());
    }
  }
});

router.post('/recoverPassword', function(req, res, next) {
  res.sendStatus(501);
});

// Private API

router.use(auth.checkToken);

router.post('/getusers', function(req, res, next) {
  dbmanager.getUsers(function(err, users) {
    if (err) {
      next(err);
    } else {
      res.send(users);
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