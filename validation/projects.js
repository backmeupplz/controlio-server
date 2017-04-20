const Joi = require('joi');

module.exports = {
  post: {
    body: {
      title: Joi.string().max(250).required(),
      type: Joi.string().valid('manager', 'client').required(),
      description: Joi.string().max(1000).allow(''),
      initialStatus: Joi.string().max(250),
      managerEmail: Joi.string().when('type', { is: 'client', then: Joi.string().email().max(100).required() }),
      clientEmails: Joi.array().when('type', { is: 'manager', then: Joi.array().items(Joi.string().email().max(100)).required() }),
      image: Joi.string(),
    },
  },
  put: {
    body: {
      projectid: Joi.string().required(),
      title: Joi.string().max(250).required(),
      description: Joi.string().max(1000).allow(''),
      image: Joi.string(),
    },
  },
  postInvite: {
    body: {
      inviteid: Joi.string().required(),
      accept: Joi.boolean().required(),
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
      clients: Joi.array().required().min(1).items(Joi.string().email().max(100)),
    },
  },
  postManagers: {
    body: {
      projectid: Joi.string().required(),
      managers: Joi.array().required().min(1).items(Joi.string().email().max(100)),
    },
  },
  finish: {
    body: {
      projectid: Joi.string().required(),
    },
  },
  delete: {
    body: {
      projectid: Joi.string().required(),
    },
  },
  getProject: {
    query: {
      projectid: Joi.string().required(),
    },
  },
  getProjects: {
    query: {
      type: Joi.string().valid('all', 'live', 'finished').allow(''),
      query: Joi.string().allow(''),
    },
  },
  deleteInvite: {
    body: {
      inviteid: Joi.string().required(),
    },
  },
  deleteManager: {
    body: {
      managerid: Joi.string().required(),
      projectid: Joi.string().required(),
    },
  },
  deleteClient: {
    body: {
      projectid: Joi.string().required(),
      clientid: Joi.string().required(),
    },
  },
  leave: {
    body: {
      projectid: Joi.string().required(),
    },
  },
};
