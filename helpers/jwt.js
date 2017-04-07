const jwt = require('jsonwebtoken');

// auth

/** Method to check if request is signed with a valid user token */
function verify(token, secret, err, data) {
  return jwt.verify(token, secret, err, data);
}
function sign(payload, secret) {
  return jwt.sign(payload, secret);
}

/** Exports */
module.exports = {
  verify,
  sign,
};
