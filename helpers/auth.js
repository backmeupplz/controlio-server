const errors = require('./errors');
const dbmanager = require('./dbmanager');
const jwt = require('jsonwebtoken');
const config = require('../config');
const validate = require('express-validation');
const validation = require('../validation/auth');

function checkToken(req, res, next) {
  validate(validation.token)(req, res, err => {
    if (err) return next(err);
  });

  const token = req.get('token');
  const userId = req.get('userId');

  jwt.verify(token, config.jwtSecret, err => {
    if (err) {
      return next(err);
    }
    dbmanager.getUserById(userId, '+token')
      .then(user => {
        if (!user) {
          return next(errors.authEmailNotRegistered());
        } else if (user.token !== token) {
          return next(errors.authTokenFailed());
        }
        next();
      })
      .catch(err => next(err));
  });
};

function checkApiKey(req, res, next) {
  validate(validation.apiKey)(req, res, err => {
    if (err) return next(err);
  });
  const apiKey = req.get('apiKey');
  if (apiKey == config.apiKey) {
    next();
  } else {
    next(errors.noApiKey());
  }
};

module.exports = {
  checkToken,
  checkApiKey
};