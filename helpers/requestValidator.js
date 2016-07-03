/**
 * Created by BackMeUpPlz on 02/07/16.
 */

var errors = require('./errors');

var checkParams = function(requiredParams, req) {
  var params = Object.keys(req.body);

  var missedParamError;
  requiredParams.every(function(requiredParam) {
    if (params.indexOf(requiredParam) > -1) {
      if (!req.body[requiredParam]) {
        missedParamError = errors.fieldNotFound(requiredParam, 403);
        return false;
      } else {
        return true;
      }
    } else {
      missedParamError = errors.fieldNotFound(requiredParam, 403);
      return false;
    }
  });

  if (missedParamError) {
    throw missedParamError;
  }
};

module.exports = {
  checkParams: checkParams
};