const Joi = require('joi');

module.exports = {
  login: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  },
  signup: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(30).required(),
    },
  },
  addManager: {
    body: {
      email: Joi.string().email().required(),
    },
  },
  deleteManager: {
    body: {
      id: Joi.string().required(),
    },
  },
  resetPassword: {
    body: {
      email: Joi.string().email().required(),
    },
  },
  magicLink: {
    body: {
      email: Joi.string().email().required(),
    },
  },
  loginMagicLink: {
    body: {
      userid: Joi.string().required(),
      token: Joi.string().required(),
    },
  },
};
