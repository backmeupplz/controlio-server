const Joi = require('joi');

module.exports = {
  post: {
    body: {
      projectid: Joi.string().required(),
    },
  },
};
