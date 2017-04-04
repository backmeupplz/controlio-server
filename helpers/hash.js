/**
 * Module to handle password hashing
 */

/** Dependencies */
const scrypt = require('scrypt');

/**
 * Method to generate a hash for the password
 * @param {String} password Password to hash
 * @return {Promise(String)} Hash of the password
 */
function hashPassword(password) {
  return scrypt.kdf(password, { N: 1, r: 1, p: 1 })
    .then(result => result.toString('base64'));
}

/**
 * Method to check if hash matches the password
 * @param {String} hash Hash to check
 * @param {String} password Password to match
 * @return {Promise(Boolean)} Whether has matches password or not
 */
function checkPassword(hash, password) {
  return scrypt.verifyKdf(new Buffer(hash, 'base64'), new Buffer(password));
}

/** Exports */
module.exports = {
  hashPassword,
  checkPassword,
};
