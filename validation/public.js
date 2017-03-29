const Joi = require('joi');

module.exports = {
  getResetPassword: {
    query: {
      token: Joi.string().required(),
    },
  },
  postResetPassword: {
    body: {
      token: Joi.string().required(),
      password: Joi.string().required(),
    },
  },
  getSetPassword: {
    query: {
      token: Joi.string().required(),
    },
  },
  postSetPassword: {
    body: {
      token: Joi.string().required(),
      password: Joi.string().required(),
    },
  },
};
