/** Dependencies */
const express = require('express');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/payments');
const payments = require('../helpers/payments');
const db = require('../helpers/db');
const demo = require('../helpers/demo');

const router = express.Router();

/** Private API check */
router.use(auth.checkToken);

/** Proxy method to stripe servers to get customer object */
router.get('/customer',
validate(validation.customer),
async (req, res, next) => {
  try {
    /** Get req params */
    const customerid = req.query.customerid;
    /** Get stripe customer */
    const customer = await payments.getStripeCustomer(customerid);
    /** Respond with customer */
    res.send(customer);
  } catch (err) {
    next(err);
  }
});

/** Check if not demo */
router.use(demo.checkDemo);

/** Proxy method to stripe servers to add payment sources to the customer */
router.post('/customer/sources',
validate(validation.postSource),
async (req, res, next) => {
  try {
    /** Get req params */
    const customerid = req.body.customerid;
    const source = req.body.source;
    /** Add stripe source */
    const newSource = await payments.addStripeSource(customerid, source);
    /** Respond with the new source */
    res.send(newSource);
  } catch (err) {
    res.send(err);
  }
});

/** Proxy method to stripe servers to change the default payment source of the customer */
router.post('/customer/default_source',
validate(validation.defaultSource),
async (req, res, next) => {
  try {
    /** Get req params */
    const customerid = req.body.customerid;
    const source = req.body.source;
    /** Set default source */
    const customer = await payments.setStripeDefaultSource(customerid, source);
    /** Respond with customer */
    res.send(customer);
  } catch (err) {
    next(err);
  }
});

/** Method to change customer's subscription at Controlio */
router.post('/customer/subscription',
validate(validation.subscription),
async (req, res, next) => {
  try {
    /** Get req params */
    const planid = req.body.planid;
    const userId = req.user._id;
    /** Set subscription */
    const user = await db.setSripeSubscription(userId, planid);
    /** Respond with user */
    res.send(user);
  } catch (err) {
    next(err);
  }
});

/** Method to apply coupon (usually discount) at Controlio */
router.post('/customer/coupon',
validate(validation.coupon),
async (req, res, next) => {
  try {
    /** Get req params */
    const coupon = req.body.coupon.toLowerCase();
    const userId = req.user._id;
    /** Apply stripe coupon */
    await db.applyStripeCoupon(userId, coupon);
    /** If coupon is 'friend', decrement number of such used coupons */
    if (coupon.toLowerCase() === 'friend') {
      await db.decrementNumberOfFriend();
    }
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Proxy method to stripe servers to delete a card */
router.delete('/customer/card',
validate(validation.deleteCard),
async (req, res, next) => {
  try {
    /** Get req params */
    const customerid = req.body.customerid;
    const cardid = req.body.cardid;
    /** Delete card */
    await payments.deleteCard(customerid, cardid);
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Export */
module.exports = router;
