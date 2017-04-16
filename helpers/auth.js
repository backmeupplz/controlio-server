/**
 * Middleware for api authorization
 */

/** Dependencies */
const errors = require('./errors');
const db = require('./db');
const jwt = require('./jwt');
const config = require('../config');
const validate = require('express-validation');
const validation = require('../validation/auth');

/** Method to check if request is signed with a valid user token */
function checkToken(req, res, next) {
  validate(validation.token)(req, res, (err) => {
    if (err) return next(err);

    const token = req.get('token');
    const { error, data } = jwt.verify(token);

    if (error) {
      return next(error);
    }
    if (!data) {
      return next(errors.authTokenFailed());
    }
    db.findUserById(data.userid)
      .select('+token')
      .then((user) => {
        if (!user) {
          return next(errors.authEmailNotRegistered());
        } else if (user.token !== token) {
          return next(errors.authTokenFailed());
        }
        req.user = user;
        next();
      })
      .catch(next);
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
