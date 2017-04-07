const jwt = require('jsonwebtoken');
const secret = require('../config').jwtSecret;


function verify(token, err, data) {
  return jwt.verify(token, secret, err, data);
}
function sign(payload, options) {
  return jwt.sign(payload, secret, options);
}

/** Exports */
module.exports = {
  verify,
  sign,
};
