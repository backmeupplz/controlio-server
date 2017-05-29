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
async function checkToken(req, res, next) {
  try {
    /** Use joi to validate token format */
    validate(validation.token)(req, res, async (err) => {
      /** Throw error if validation unsuccessful */
      if (err) {
        throw err;
      }
      /** Get req params */
      const token = req.get('token');
      /** Try to verify jwt token */
      const { error, data } = jwt.verify(token);
      /** Throw error if token is invalid */
      if (error) {
        throw error;
      }
      /** Throw error if token has no data in it */
      if (!data) {
        throw errors.authTokenFailed();
      }
      /** Get user from db */
      const user = await db.findUserById(data.userid)
        .select('+token');
      /** Throw error if no users exists */
      if (!user) {
        throw errors.authEmailNotRegistered();
      }
      /** Throw error if jwt's don't match */
      if (user.token !== token) {
        throw errors.authTokenFailed();
      }
      /** Save user in req */
      req.user = user;
      /** Continue execution of router */
      next();
    });
  } catch (err) {
    next(err);
  }
}

/** Method to check if request is signed with a valid api key */
function checkApiKey(req, res, next) {
  try {
    /** Use joi to validate api key format */
    validate(validation.apiKey)(req, res, (err) => {
      /** Throw error if validation unsuccessful */
      if (err) {
        throw err;
      }
      /** Get req params */
      const apiKey = req.get('apiKey');
      /** Throw error if api keys don't match */
      if (apiKey !== config.apiKey) {
        throw errors.noApiKey();
      }
      /** Continue execution of router */
      next();
    });
  } catch (err) {
    next(err);
  }
}

/** Exports */
module.exports = {
  checkToken,
  checkApiKey,
};
