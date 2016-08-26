var Joi = require('joi');

module.exports = {
  login: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }
  },
  signup: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }
  },
  addManager: {
    body: {
      email: Joi.string().email().required()
    }
  },
  deleteManager: {
    body: {
      email: Joi.string().email().required()
    }
  }
};