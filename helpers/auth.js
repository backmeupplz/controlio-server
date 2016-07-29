const errors = require('./errors');
const dbmanager = require('./dbmanager');
const jwt = require('jsonwebtoken');
const config = require('../config');

function checkToken(req, res, next) {
  const token = req.get('x-access-token');
  const userId = req.get('x-access-user-id');

  function getUserCallback(err, user, token) {
    if (err) {
      next(err);
    } else if (user) {
      if (user.token == token) {
        next();
      } else {
        next(errors.authTokenFailed());
      }
    } else {
      next(errors.authEmailNotRegistered());
    }
  };

  if (!userId) {
    next(errors.fieldNotFound('user id', 403));
  } else if (!token) {
    next(errors.fieldNotFound('token', 403));
  } else {
    jwt.verify(token, config.jwtSecret, function(err) {
      if (err) {
        next(errors.authTokenFailed());
      } else {
        dbmanager.getUserById(userId, function(err, user) {
          getUserCallback(err, user, token);
        }, '+token');
      }
    });
  }
};

function checkApiKey(req, res, next) {
  var apiKey = req.get('x-access-apiKey');
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