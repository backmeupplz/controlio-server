const Joi = require('joi');

module.exports = {
  getResetPassword: {
    query: {
      userid: Joi.string().required(),
      token: Joi.string().required(),
    },
  },
  postResetPassword: {
    body: {
      userid: Joi.string().required(),
      token: Joi.string().required(),
      password: Joi.string().required(),
    },
  },
};
