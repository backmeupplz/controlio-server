var errors = require('./errors');
var dbmanager = require('./dbmanager');
var jwt = require('jsonwebtoken');
var config = rootRequire('config');

var checkToken = function(req, res, next) {
  var token = req.get('x-access-token');
  var userId = req.get('x-access-user-id');
  
  var getUserCallback = function(err, user, token) {
    if (err) {
      next(err);
    } else if (user) {
      if (user.token == token) {
        next();
      } else {
        next(errors.tokenFailed());
      }
    } else {
      next(errors.authEmailNotRegistered());
    }
  };

  if (!userId) {
    next(errors.authNoUserId());
  } else if (!token) {
    next(errors.noTokenProvided());
  } else {
    jwt.verify(token, config.jwtSecret, function(err) {
      if (err) {
        next(errors.tokenFailed());
      } else {
        dbmanager.getUser({_id: userId}, function(err, user) {
          getUserCallback(err, user, token);
        }, '+token');
      }
    });
  }
};

var checkApiKey = function(req, res, next) {
  var apiKey = req.get('x-access-apiKey');
  if (apiKey == config.apiKey) {
    next();
  } else {
    next(errors.noApiKey());
  }
};

module.exports = {
  checkToken: checkToken,
  checkApiKey: checkApiKey
};