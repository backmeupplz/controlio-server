const Joi = require('joi');

module.exports = {
  magic: {
    query: {
      userid: Joi.string().required(),
      token: Joi.string().required(),
    },
  },
};