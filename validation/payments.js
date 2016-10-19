const Joi = require('joi');

module.exports = {
  customer: {
    query: {
      customerid: Joi.string().required(),
    },
  },
  postSource: {
    body: {
      customerid: Joi.string().required(),
    },
  },
  defaultSource: {
    body: {
      customerid: Joi.string().required(),
    },
  },
};
