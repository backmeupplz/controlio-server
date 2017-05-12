const Joi = require('joi');

module.exports = {
  post: {
    body: Joi.object().keys({
      projectid: Joi.string().required(),
      type: Joi.string().valid('post', 'status'),
      text: Joi.string().when('type', { is: 'post', then: Joi.string().max(1000), otherwise: Joi.string().max(250) }).allow(null),
      attachments: Joi.array().max(10),
    }).or('text', 'attachments'),
  },
  put: {
    body: Joi.object().keys({
      projectid: Joi.string().required(),
      type: Joi.string().valid('post', 'status'),
      text: Joi.string().when('type', { is: 'status', then: Joi.string().max(250), otherwise: Joi.string().max(1000) }).allow(null),
      attachments: Joi.array().max(10),
    }).or('text', 'attachments'),
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
