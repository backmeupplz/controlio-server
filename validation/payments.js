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
      source: Joi.required(),
    },
  },
  defaultSource: {
    body: {
      customerid: Joi.string().required(),
      source: Joi.required(),
    },
  },
  subscription: {
    body: {
      planid: Joi.number().required(),
    },
  },
  coupon: {
    body: {
      coupon: Joi.string().required(),
    },
  },
};
