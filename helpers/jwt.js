const jwt = require('jsonwebtoken');
const secret = require('../config').jwtSecret;

function verify(token) {
  const result = {};
  try {
    result.data = jwt.verify(token, secret);
  } catch (err) {
    result.error = err;
  }
  return result;
}

function sign(payload, options) {
  return jwt.sign(payload, secret, options);
}

/** Exports */
module.exports = {
  verify,
  sign,
};
