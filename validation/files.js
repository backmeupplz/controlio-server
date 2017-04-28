const Joi = require('joi');

module.exports = {
  download: {
    query: {
      key: Joi.string().required(),
    },
  },
  upload: {
    payload: {
      key: Joi.string().required(),
    },
  },
};
