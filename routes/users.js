const express = require('express');
const router = express.Router();
const dbmanager = require('../helpers/dbmanager');
const hash = require('../helpers/hash');
const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const requestValidator = require('../helpers/requestValidator');

// Public API

router.post('/login', (req, res, next) => {
  try {
    requestValidator.checkParams(['email', 'password'], req);
  } catch (paramsError) {
    next(paramsError);
    return;
  }

  const email = req.body.email;
  const rawPassword = req.body.password;

  function getUserCallback(err, user) {
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

  dbmanager.getUser({ email }, getUserCallback, '+password +token');
});

router.post('/signUp', function(req, res, next) {
  try {
    requestValidator.checkParams(['email', 'password'], req);
  } catch (paramsError) {
    next(paramsError);
    return;
  }

  const email = req.body.email;
  const rawPassword = req.body.password;

  function addUserCallback(err, user) {
    if (err) {
      next(err);
    } else {
      user.password = undefined;
      res.send(user);
    }
  };

  dbmanager.addUser({
    email,
    password: hash.hashPassword(rawPassword),
    token: jwt.sign(email, config.jwtSecret)
  }, addUserCallback);
});

// todo: add password recovery
router.post('/recoverPassword', (req, res, next) => {
  next(errors.error(501));
});

// Export

module.exports = router;