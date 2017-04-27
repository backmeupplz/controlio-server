const Joi = require('joi');

module.exports = {
  download: {
    query: {
      key: Joi.string().required(),
    },
  },
  upload: {
    body: {
      key: Joi.string().required(),
    },
  },
};
