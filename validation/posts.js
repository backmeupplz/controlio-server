const Joi = require('joi');

module.exports = {
  post: {
    body: {
      projectid: Joi.string().required(),
      type: Joi.string().valid('post', 'status'),
      text: Joi.string().required(),
    },
  },
  put: {
    body: {
      postid: Joi.string().required(),
      text: Joi.string().required(),
    },
  },
  delete: {
    body: {
      postid: Joi.string().required(),
    },
  },
  get: {
    query: {
      projectid: Joi.string().required(),
    },
  },
};
