var express = require('express');
var router = express.Router();
var dbmanager = require('../helpers/dbmanager');
var hash = require('../helpers/hash');
var jwt = require('jsonwebtoken');
var config = require('../config');
var errors = require('../helpers/errors');
var auth = require('../helpers/auth');
var requestValidator = require('../helpers/requestValidator');

// Public API

router.post('/login', function(req, res, next) {
  try {
    requestValidator.checkParams(['email', 'password'], req);
  } catch (paramsError) {
    next(paramsError);
    return;
  }

  var email = req.body.email;
  var rawPassword = req.body.password;

  var getUserCallback = function (err, user) {
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

  dbmanager.getUser({email: email}, getUserCallback, '+password +token');
});

router.post('/signup', function(req, res, next) {
  try {
    requestValidator.checkParams(['email', 'password'], req);
  } catch (paramsError) {
    next(paramsError);
    return;
  }

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
  
  var user = {
    email: email,
    password: hash.hashPassword(rawPassword),
    token: jwt.sign(email, config.jwtSecret)
  };

  dbmanager.addUser(user, addUserCallback);
});

// todo: add password recovery
router.post('/recoverPassword', function(req, res, next) {
  res.sendStatus(501);
});

// Private API

router.use(auth.checkToken);

// DEBUG

router.get('/removeallusers', function(req, res, next) {
  dbmanager.debug.removeAllUsers(function (err) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(200);
    }
  });
});

// Export

module.exports = router;