const errors = require('./errors');

function checkParams(requiredParams, req) {
  const params = Object.keys(req.body);

  let missedParamError;
  requiredParams.forEach(requiredParam => {
    if (params.indexOf(requiredParam) > -1) {
      if (!req.body[requiredParam]) {
        missedParamError = errors.fieldNotFound(requiredParam, 403);
      }
    } else {
      missedParamError = errors.fieldNotFound(requiredParam, 403);
    }
  });
  return missedParamError;
};

function check(parameters) {
  return (req, res, next) => {
    next(checkParams(parameters, req));
  };
};

module.exports = {
  check
};