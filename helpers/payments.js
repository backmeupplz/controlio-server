/**
 * Module to handle payments stuff
 */

/** Dependencies */
const config = require('../config');
const stripe = require('stripe')(config.stripeApiKey);
const reporter = require('./reporter');

/**
 * Proxy method to create a customer at Stripe
 * @param {String} email Email of the new customer
 * @return {Promise(Stripe:Customer)} Customer created by Stripe
 */
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

/**
 * Proxy method to get a customer from Stripe
 * @param {String} customerId Id of Stripe customer to get
 * @return {Promise(Stripe:Customer)} Customer from Stripe
 */
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

/**
 * Proxy method to add a Stripe payment source to the Stripe customer
 * @param {String} customerid Id of the customer to add a payment source
 * @param {Stripe:Source} source Json of the new Stripe source
 * @return {Promise(Stripe:Source)} New Stripe payment source
 */
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

/**
 * Proxy method to set a Stripe customer default payment source
 * @param {String} customerId Id of the customer to set a default payment source
 * @param {Stripe:Source} source Json of the new default Stripe source
 * @return {Promise(Stripe:Customer)} Customer from Stripe
 */
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

/**
 * Method to set user's stripe subscription
 * @param {Mongo:User} user User to change plan
 * @param {Stripe:SubscriptionId} planid Id of the Stripe subscription to apply to the user
 * @return {Promise(Mongo:User)} New edited user
 */
function setSripeSubscription(user, planid) {
  return new Promise((resolve, reject) => {
    if (!user.stripeSubscriptionId) {
      stripe.subscriptions.create({
        customer: user.stripeId,
        plan: planid,
      }, (err, subscription) => {
        if (err) {
          reject(err);
        } else {
          user.stripeSubscriptionId = subscription.id;
          user.plan = planid;

          reporter.reportChangeSubscription(user, planid);

          user.save()
            .then(resolve)
            .catch(reject);
        }
      });
    } else {
      stripe.subscriptions.update(
        user.stripeSubscriptionId,
        { plan: planid },
        (err) => {
          if (err) {
            reject(err);
          } else {
            user.plan = planid;

            reporter.reportChangeSubscription(user, planid);

            user.save()
              .then(resolve)
              .catch(reject);
          }
        }
      );
    }
  });
}

/**
 * Method to apply a coupon for the user
 * @param {Mongo:User} user User that applies the coupon
 * @param {String} coupon Id of the coupon to apply
 * @return {Promise(Stripe:Customer)} Customer that had coupon applied
 */
function applyStripeCoupon(user, coupon) {
  return new Promise((resolve, reject) => {
    stripe.coupons.retrieve(
      coupon,
      (err, stripeCoupon) => {
        if (err) {
          reject(err);
        } else {
          stripe.customers.update(user.stripeId, {
            coupon: stripeCoupon.id,
          }, (inErr, customer) => {
            if (inErr) {
              reject(inErr);
            } else {
              reporter.reportRedeemCoupon(user, coupon);

              resolve(customer);
            }
          });
        }
      }
    );
  });
}

/**
 * Method to delete bank card from a customer
 * @param {Stripe:Id} customerId Id of the customer whos card to delete
 * @param {Stripe:Id} cardId Id of the card to delete
 * @return {Promise()} Promise that's called upon completion
 */
function deleteCard(customerId, cardId) {
  return new Promise((resolve, reject) => {
    stripe.customers.deleteCard(
      customerId,
      cardId,
      (err, confirmation) => {
        if (err) {
          reject(err);
        } else {
          resolve(confirmation);
        }
      }
    );
  });
}

/** Exports */
module.exports = {
  createStripeCustomer,
  getStripeCustomer,
  addStripeSource,
  setStripeDefaultSource,
  setSripeSubscription,
  applyStripeCoupon,
  deleteCard,
};
