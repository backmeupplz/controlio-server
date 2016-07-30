const errors = require('./errors');

function checkParams(requiredParams, req) {
  const params = Object.keys(req.body);

  let missedParamError;
  requiredParams.every(requiredParam => {
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
    return missedParamError;
  } else {
    return null;
  }
};

module.exports = {
  checkParams
};