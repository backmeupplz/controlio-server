const Joi = require('joi');

module.exports = {
  magic: {
    query: {
      token: Joi.string().required(),
    },
  },
};
