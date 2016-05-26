var scrypt = require("scrypt");
var scryptParameters = scrypt.paramsSync(0.1);

var hashPassword = function(password) {
  return scrypt.kdfSync(new Buffer(password), scryptParameters).toString('base64');
};

var checkPassword = function(hash, password) {
  console.log(hash);
  console.log(password);
  return scrypt.verifyKdfSync(new Buffer(hash, 'base64'), new Buffer(password));
};

module.exports = {
  hashPassword: hashPassword,
  checkPassword: checkPassword
};