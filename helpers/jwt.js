const jwt = require('jsonwebtoken');
const secret = require('../config').jwtSecret;

function verify(token) {
  return jwt.verify(token, secret);
}

function sign(payload, options) {
  return jwt.sign(payload, secret, options);
}

/** Exports */
module.exports = {
  verify,
  sign,
};
