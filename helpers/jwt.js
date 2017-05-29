const jwt = require('jsonwebtoken');
const secret = require('../config').jwtSecret;

/**
 * Method to verify jwt token format
 * @param {String} token Token to verify
 * @return {data, error} Object containing either error or decrypted data
 */
function verify(token) {
  const result = {};
  try {
    result.data = jwt.verify(token, secret);
  } catch (err) {
    result.error = err;
  }
  return result;
}

/**
 * Method to create jwt token
 * @param {Object} payload Object that gets saved to jwt token
 * @param {Object} options Various options
 * @return {Promise(String)} Promise with resulting token
 */
function sign(payload, options) {
  return jwt.sign(payload, secret, options);
}

/** Exports */
module.exports = {
  verify,
  sign,
};
