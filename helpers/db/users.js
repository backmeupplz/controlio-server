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
 * @return User User that should be created
 * @throws {PASSWORD_NOT_FOUND_ERROR} If user is found without password
 * @throws {USER_ALREADY_EXIST_ERROR} If User already exists with password
 */
async function addUser(user) {
  /** Get user from db by email */
  const dbuser = await findUser({ email: user.email })
    .select('password');
  /** If no user exist, create one and return */
  if (!dbuser) {
    return await createUser(user);
  }
  /** If user doesn't have a password, send a link to create one and throw
  error about not having password */
  if (!dbuser.password) {
    dbuser.sendSetPassword();
    throw errors.passwordNotExist();
  }
  /** Throw error as user exists */
  throw errors.authUserAlreadyExists();
}

/**
 * Function to get one user from database (or create one if it doesn't exist yet)
 * @param {String} email Email of the user to find or create; should be a valid email
 * @return {Mongoose:User} The requested user
 */
async function findOrCreateUserWithEmail(email) {
  /** Get user from db */
  let user = await User.findOne({ email });
  /** Create new user if it doesn't exist */
  if (!user) {
    user = await createUser({ email });
  }
  /** Return resulting user */
  return user;
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
 * Function to get multiple users from database
 * @param {Object} query Query to find the users
 * @return {Promise([Mongoose:User])} Promise with a users from the database
 */
function findUsers(query) {
  return User.find(query);
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
 * @return {Mongoose:User} User object with only id, email, name, phone, photo
 */
async function getProfile(userId) {
  /** Get user from db */
  const user = await findUserById(userId);
  /** Thorow error if no user found */
  if (!user) {
    throw errors.noUserFound();
  }
  /** Return user with only relevant fields */
  return _.pick(user.toObject(), ['_id', 'email', 'name', 'phone', 'photo']);
}

/**
 * Method to remove push notification tokens
 * @param {[String]]} tokens Tokens to remove
 */
async function removeTokens(tokens) {
  /** Loop through all tokens */
  tokens.forEach(async (token) => {
    /** Find users with such token */
    const users = await User.find({ iosPushTokens: token });
    /** Loop through those users */
    users.forEach(async (user) => {
      /** Remove token from ios push tokens */
      user.iosPushTokens.splice(user.iosPushTokens.indexOf(token), 1);
      /** save user */
      await user.save();
    });
  });
}

/**
 * Method to change user's Stripe subscription id
 * @param {Mongoose:ObjectId} userId Id of the users to get subscription changed
 * @param {Number} planid Id of the plan
 * @throws {USER_NOT_FOUND_ERROR} If user with such id was not found
 * @return {Mongoose:User} User for which the subscription was changed
 */
async function setSripeSubscription(userId, planid) {
  /** Get user from db */
  const user = await findUserById(userId)
    .select('token email isDemo isAdmin plan stripeId stripeSubscriptionId');
  /** Throw error if user not found */
  if (!user) {
    throw errors.noUserFound();
  }
  /** Set subscription and return user */
  return await payments.setSripeSubscription(user, planid);
}

/**
 * Method to apply stripe coupon
 * @param {Mongoose:ObjectId} userId Id of the user that applies coupon
 * @param {String} coupon Id of the coupon
 * @throws {USER_NOT_FOUND_ERROR} If user with such id was not found
 * @throws {COUPON_ALREADY_USERD_ERROR} If coupon has already been used
 * @return {Mongoose:User} User who used this coupon
 */
async function applyStripeCoupon(userId, coupon) {
  /** Get user from db */
  const user = await findUserById(userId)
    .select('token email isDemo isAdmin plan stripeId stripeSubscriptionId coupons');
  /** Throw error if no user found */
  if (!user) {
    throw errors.noUserFound();
  }
  /** Throw error if coupon already used */
  if (user.coupons.includes(coupon)) {
    throw errors.couponAlreadyUsed();
  }
  /** Apply coupon on stripe */
  await payments.applyStripeCoupon(user, coupon);
  /** Add coupon to user's used coupons */
  user.coupons.push(coupon);
  /** Save and return user */
  return await user.save();
}

/**
 * Creates a user and adds stripe customer id to it
 * @param {Object} user Object with user's properties
 * @return {Mongoose:User} Created user
 */
async function createUser(user) {
  /** Create stripe customer */
  const customer = await payments.createStripeCustomer(user.email);
  /** Save stripe id to user */
  user.stripeId = customer.id;
  /** Create new mongoose user object */
  const newUser = new User(user);
  /** Save user object and return it */
  return await newUser.save();
}

module.exports = {
  addUser,
  findOrCreateUserWithEmail,
  findUser,
  findUsers,
  findUserById,
  getProfile,
  removeTokens,
  setSripeSubscription,
  applyStripeCoupon,
};
