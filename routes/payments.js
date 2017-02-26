/** Dependencies */
const express = require('express');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/payments');
const payments = require('../helpers/payments');
const dbmanager = require('../helpers/dbmanager');

const router = express.Router();

/** Private API check */
router.use(auth.checkToken);

/** Proxy method to stripe servers to get customer object */
router.get('/customer', validate(validation.customer), (req, res, next) => {
  const customerid = req.query.customerid;
  payments.getStripeCustomer(customerid)
    .then(customer => res.send(customer))
    .catch(err => next(err));
});

/** Proxy method to stripe servers to get payment sources of the customer */
router.post('/customer/sources', validate(validation.postSource), (req, res, next) => {
  const customerid = req.body.customerid;
  const source = req.body.source;
  payments.addStripeSource(customerid, source)
    .then(newSource => res.send(newSource))
    .catch(err => next(err));
});

/** Proxy method to stripe servers to get the default payment source of the customer */
router.post('/customer/default_source', validate(validation.defaultSource), (req, res, next) => {
  const customerid = req.body.customerid;
  const source = req.body.source;
  payments.setStripeDefaultSource(customerid, source)
    .then(customer => res.send(customer))
    .catch(err => next(err));
});

/** Method to change customer's subscription at Controlio */
router.post('/customer/subscription', validate(validation.subscription), (req, res, next) => {
  const planid = req.body.planid;
  const userId = req.get('userId');
  dbmanager.setSripeSubscription(userId, planid)
    .then(user => res.send(user))
    .catch(err => next(err));
});

/** Method to apply coupon (usually discount) at Controlio */
router.post('/customer/coupon', validate(validation.coupon), (req, res, next) => {
  const coupon = req.body.coupon;
  const userId = req.get('userId');
  dbmanager.applyStripeCoupon(userId, coupon)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

/** Export */
module.exports = router;
