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
 * @return {String} Promise with resulting token
 */
async function sign(payload, options) {
  return await jwt.sign(payload, secret, options);
}

/** Exports */
module.exports = {
  verify,
  sign,
};
