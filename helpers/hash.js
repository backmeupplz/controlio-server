const scrypt = require('scrypt');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    scrypt.kdf(password, { N: 1, r: 1, p: 1 })
      .then(result => resolve(result.toString('base64')))
      .catch(reject);
  });
}

function checkPassword(hash, password) {
  return scrypt.verifyKdf(new Buffer(hash, 'base64'), new Buffer(password));
}

module.exports = {
  hashPassword,
  checkPassword,
};
