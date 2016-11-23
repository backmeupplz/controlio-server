const config = require('../config');
const stripe = require('stripe')(config.stripeApiKey);
const botReporter = require('./botReporter');

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

function setSripeSubscription(user, planid) {
  return new Promise((resolve, reject) => {
    const userCopy = Object.create(user);
    if (!user.stripeSubscriptionId) {
      stripe.subscriptions.create({
        customer: user.stripeId,
        plan: planid,
      }, (err, subscription) => {
        if (err) {
          reject(err);
        } else {
          userCopy.stripeSubscriptionId = subscription.id;
          userCopy.plan = planid;

          botReporter.reportChangeSubscription(userCopy, planid);

          userCopy.save()
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
            userCopy.plan = planid;

            botReporter.reportChangeSubscription(userCopy, planid);

            userCopy.save()
              .then(resolve)
              .catch(reject);
          }
        }
      );
    }
  });
}

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
              botReporter.reportRedeemCoupon(user, coupon);

              resolve(customer);
            }
          });
        }
      }
    );
  });
}

module.exports = {
  createStripeCustomer,
  getStripeCustomer,
  addStripeSource,
  setStripeDefaultSource,
  setSripeSubscription,
  applyStripeCoupon,
};
