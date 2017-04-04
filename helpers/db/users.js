/**
 * Manages all db requests for users
 */

const { User } = require('../../models');
const errors = require('../errors');
const payments = require('../payments');
const _ = require('lodash');

/**
 * Function to add a user
 * @param {Object} user User object to create new database user
 * @return {Promise(Mongoose:User)} Promise with the User that should be created
 * @throws {PASSWORD_NOT_FOUND_ERROR} If user is found without password
 * @throws {USER_ALREADY_EXIST_ERROR} If User already exists with password
 */
function addUser(user) {
  return findUser({ email: user.email })
    .select('password')
    .then((dbuser) => {
      if (dbuser) {
        if (!dbuser.password) {
          dbuser.sendSetPassword();
          throw errors.passwordNotExist();
        } else {
          throw errors.authUserAlreadyExists();
        }
      } else {
        return createUser(user);
      }
    });
}

/**
 * Function to get one user from database (or create one if it doesn't exist yet)
 * @param {String} email Email of the user to find or create; should be a valid email
 * @return {Promise(Mongoose:User)} Promise with the requested user
 */
function findOrCreateUserWithEmail(email) {
  return User.findOne({ email })
    .then((user) => {
      if (user) {
        return user;
      }
      return createUser({ email });
    });
}

/**
 * Function to get one user from database
 * @param {Object} query Query to find the right user
 * @return {Promise(Mongoose:User)} Promise with a User from the database
 */
function findUser(query) {
  return User.findOne(query);
}

/**
 * Function to find a user by id
 * @param {Mongoose:ObjectId} id Id of the user to find
 * @return {Promise(Mongoose:User)} User with such id
 */
function findUserById(id) {
  return User.findById(id);
}

/**
 * Function to get user's profile
 * @param {Mongoose:ObjectId} userId Id of the user to get profile
 * @throws {USER_NOT_FOUND_ERROR} If required user doesn't exist
 * @return {Promise(Mongoose:User)} User object
 */
function getProfile(userId) {
  return findUserById(userId)
    .then((user) => {
      if (!user) {
        throw errors.noUserFound();
      }
      return _.pick(user.toObject(), ['_id', 'email', 'name', 'phone', 'photo']);
    });
}

/**
 * Method to remove push notification tokens
 * @param {[String]]} tokens Tokens to remove
 */
function removeTokens(tokens) {
  tokens.forEach((token) => {
    User.find({ iosPushTokens: token })
      .then((users) => {
        users.forEach((user) => {
          user.iosPushTokens.splice(user.iosPushTokens.indexOf(token), 1);
          user.save();
        });
      })
      .catch(err => console.error(err));
  });
}

/**
 * Method to change user's Stripe subscription id
 * @param {Mongoose:ObjectId} userId Id of the users to get subscription changed
 * @param {Number} planid Id of the plan
 */
function setSripeSubscription(userId, planid) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .select('token email isDemo isAdmin plan stripeId stripeSubscriptionId')
      .then((user) => {
        if (!user) {
          throw errors.noUserFound();
        }
        return user;
      })
      .then(user =>
        payments.setSripeSubscription(user, planid)
          .then(resolve)
          .catch(reject))
  );
}

/**
 * Method to apply stripe coupon
 * @param {Mongoose:ObjectId} userId Id of the user that applies coupon
 * @param {String} coupon Id of the coupon
 */
function applyStripeCoupon(userId, coupon) {
  return new Promise((resolve, reject) =>
    findUserById(userId)
      .select('token email isDemo isAdmin plan stripeId stripeSubscriptionId')
      .then((user) => {
        if (!user) {
          throw errors.noUserFound();
        }
        return user;
      })
      .then(user =>
        payments.applyStripeCoupon(user, coupon)
          .then(resolve)
          .catch(reject))
  );
}

/**
 * Creates a user and adds customer id to it
 * @param {Object} user Object with user's properties
 * @return {Promise(Mongoose:User)} Created user
 */
function createUser(user) {
  return payments.createStripeCustomer(user.email)
    .then((customer) => {
      user.stripeId = customer.id;
      const newUser = new User(user);
      return newUser.save();
    });
}

module.exports = {
  addUser,
  findOrCreateUserWithEmail,
  findUser,
  findUserById,
  getProfile,
  removeTokens,
  setSripeSubscription,
  applyStripeCoupon,
};
