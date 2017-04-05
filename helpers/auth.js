/**
 * Middleware for api authorization
 */

/** Dependencies */
const errors = require('./errors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const config = require('../config');
const validate = require('express-validation');
const validation = require('../validation/auth');

/** Method to check if request is signed with a valid user token */
function checkToken(req, res, next) {
  validate(validation.token)(req, res, (err) => {
    if (err) {
      return next(err);
    }
    const token = req.get('token');
    jwt.verify(token, config.jwtSecret, (inerror, data) => {
      if (inerror) {
        return next(inerror);
      }
      if (!data || !data.userid) {
        return next(errors.authTokenFailed());
      }
      db.findUserById(data.userid)
        .select('token isDemo')
        .then((user) => {
          if (!user) {
            return next(errors.authEmailNotRegistered());
          } else if (user.token !== token) {
            return next(errors.authTokenFailed());
          }
          req.user = user;
          next();
        })
        .catch(error => next(error));
    });
  });
}

/** Method to check if request is signed with a valid api key */
function checkApiKey(req, res, next) {
  validate(validation.apiKey)(req, res, (err) => {
    if (err) return next(err);

    const apiKey = req.get('apiKey');
    if (apiKey === config.apiKey) {
      next();
    } else {
      next(errors.noApiKey());
    }
  });
}

/** Exports */
module.exports = {
  checkToken,
  checkApiKey,
};
