const Joi = require('joi');

module.exports = {
  post: {
    body: {
      projectid: Joi.string().required(),
    },
  },
  put: {
    body: {
      postid: Joi.string().required(),
      text: Joi.string().required(),
    },
  },
};
