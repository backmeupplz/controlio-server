const Joi = require('joi');

module.exports = {
  login: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  },
  loginFacebook: {
    body: {
      access_token: Joi.string().required(),
    },
  },
  signup: {
    body: {
      email: Joi.string().email().max(100).required(),
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
  setPassword: {
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
      token: Joi.string().required(),
    },
  },
  editProfile: {
    body: {
      name: Joi.string().max(100),
      phone: Joi.string().max(15),
    },
  },
  postResetPassword: {
    body: {
      token: Joi.string().required(),
      password: Joi.string().min(6).max(30).required(),
    },
  },
};
