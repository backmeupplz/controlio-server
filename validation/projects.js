const Joi = require('joi');

module.exports = {
  post: {
    body: {
      title: Joi.string().required(),
    },
  },
  put: {
    body: {
      projectid: Joi.string().required(),
      title: Joi.string().required(),
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
      clients: Joi.array().required(),
    },
  },
  postManagers: {
    body: {
      projectid: Joi.string().required(),
      managers: Joi.array().required(),
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
  getProject: {
    query: {
      projectid: Joi.string().required(),
    },
  },
  getProjects: {
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
