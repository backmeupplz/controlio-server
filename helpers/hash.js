const scrypt = require('scrypt');

function hashPassword(password) {
  return scrypt.kdf(password, { N: 1, r: 1, p: 1 })
    .then(result => result.toString('base64'));
}

function checkPassword(hash, password) {
  return scrypt.verifyKdf(new Buffer(hash, 'base64'), new Buffer(password));
}

module.exports = {
  hashPassword,
  checkPassword,
};
