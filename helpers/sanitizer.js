/** Dependencies */
const _ = require('lodash');

/** Method to trim non-empty string and nullify empty string */
function trimAndNulify(str) {
  if (str === null || !_.isString(str)) {
    return str;
  }
  const trimmedStr = str.trim();
  if (trimmedStr.length > 0) {
    return trimmedStr;
  }
  return null;
}

/** Exports */
module.exports = (req, res, next) => {
  Object.keys(req.body).forEach((key) => {
    req.body[key] = trimAndNulify(req.body[key]);
  });
  Object.keys(req.query).forEach((key) => {
    req.query[key] = trimAndNulify(req.query[key]);
  });
  next();
};
