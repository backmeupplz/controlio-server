var errors = require('./errors');
var dbmanager = require('./dbmanager');
var jwt = require('jsonwebtoken');
var config = rootRequire('config');

var checkToken = function(req, res, next) {
  var token = req.get('x-access-token');
  var userId = req.body.userId;

  var getUserCallback = function(err, user, token) {
    if (err) {
      res.send(err);
    } else if (user) {
      if (user.token == token) {
        next();
      } else {
        res.send(errors.tokenFailed());
      }
    } else {
      res.send(errors.authEmailNotRegistered());
    }
  };

  if (!userId) {
    res.send(errors.authNoUserId());
  } else if (!token) {
    res.send(errors.noTokenProvided());
  } else {
    jwt.verify(token, config.jwtSecret, function(err) {
      if (err) {
        res.send(errors.tokenFailed());
      } else {
        dbmanager.getUser({_id: userId}, function(err, user) {
          getUserCallback(err, user, token);
        }, '+token');
      }
    });
  }
};

module.exports.checkToken = checkToken;