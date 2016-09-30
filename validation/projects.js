const Joi = require('joi');

module.exports = {
  post: {
    body: {
      title: Joi.string().required(),
      image: Joi.string().required(),
      status: Joi.string().required(),
      description: Joi.string().required(),
      manager: Joi.string().required(),
      clients: Joi.required(),
    },
  },
};
