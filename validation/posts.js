const Joi = require('joi');

module.exports = {
  post: {
    body: {
      projectid: Joi.string().required(),
      type: Joi.string().valid('post', 'status'),
      text: Joi.string().when('type', { is: 'status', then: Joi.string().max(250).required(), otherwise: Joi.string().required() }),
      attachments: Joi.array().max(10),
    },
  },
  put: {
    body: {
      projectid: Joi.string().required(),
      postid: Joi.string().required(),
      text: Joi.string().required(),
      attachments: Joi.array().max(10),
    },
  },
  delete: {
    body: {
      postid: Joi.string().required(),
      projectid: Joi.string().required(),
    },
  },
  get: {
    query: {
      projectid: Joi.string().required(),
    },
  },
};
