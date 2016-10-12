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
  put: {
    body: {
      projectid: Joi.string().required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
      image: Joi.string().required(),
    },
  },
  postStatus: {
    body: {
      projectid: Joi.string().required(),
      status: Joi.string().required(),
    },
  },
  postClients: {
    body: {
      projectid: Joi.string().required(),
      clients: Joi.required(),
    },
  },
  archive: {
    body: {
      projectid: Joi.string().required(),
    },
  },
  unarchive: {
    body: {
      projectid: Joi.string().required(),
    },
  },
  delete: {
    body: {
      projectid: Joi.string().required(),
    },
  },
};
