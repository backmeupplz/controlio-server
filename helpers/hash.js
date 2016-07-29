const scrypt = require("scrypt");
const scryptParameters = scrypt.paramsSync(0.1);

function hashPassword(password) {
  return scrypt.kdfSync(new Buffer(password), scryptParameters).toString('base64');
};

function checkPassword(hash, password) {
  return scrypt.verifyKdfSync(new Buffer(hash, 'base64'), new Buffer(password));
};

module.exports = {
  hashPassword,
  checkPassword
};