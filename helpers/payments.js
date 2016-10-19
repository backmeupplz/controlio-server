const stripe = require('stripe')('sk_test_t4v531gxDQirk1hxuRb1PUOM');

function createStripeCustomer(email) {
  return new Promise((resolve, reject) => {
    stripe.customers.create({
      description: `Customer for ${email}`,
    }, (err, customer) => {
      if (err) {
        reject(err);
      } else {
        resolve(customer);
      }
    });
  });
}

function getStripeCustomer(customerId) {
  return new Promise((resolve, reject) => {
    stripe.customers.retrieve(customerId, (err, customer) => {
      if (err) {
        reject(err);
      } else {
        resolve(customer);
      }
    });
  });
}

function addStripeSource(customerid, source) {
  return new Promise((resolve, reject) => {
    stripe.customers.createSource(customerid, {
      source,
    }, (err, newSource) => {
      if (err) {
        reject(err);
      } else {
        resolve(newSource);
      }
    });
  });
}

function setStripeDefaultSource(customerid, source) {
  return new Promise((resolve, reject) => {
    stripe.customers.update(customerid, {
      default_source: source,
    }, (err, customer) => {
      if (err) {
        reject(err);
      } else {
        resolve(customer);
      }
    });
  });
}

module.exports = {
  createStripeCustomer,
  getStripeCustomer,
  addStripeSource,
  setStripeDefaultSource,
};
