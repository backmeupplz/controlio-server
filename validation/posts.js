const Joi = require('joi');

module.exports = {
  post: {
    body: {
      projectid: Joi.string().required(),
      type: Joi.string().valid('post', 'status'),
    },
  },
  put: {
    body: {
      postid: Joi.string().required(),
    },
  },
  delete: {
    body: {
      postid: Joi.string().required(),
    },
  },
};
