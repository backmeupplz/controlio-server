const Joi = require('joi');

module.exports = {
  apiKey: {
    headers: {
      apikey: Joi.string().required()
    }
  },
  token: {
    headers: {
      token: Joi.string().required()
    }
  }
};