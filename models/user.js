const mongoose = require('mongoose');
const config = require('../config');
const randomToken = require('random-token').create(config.randomTokenSalt);
const _ = require('lodash');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  /** Stripe */
  stripeId: {
    type: String,
    required: true,
    select: false,
  },
  stripeSubscriptionId: {
    type: String,
    select: false,
  },
  plan: {
    type: Number,
    required: true,
    default: 0,
    select: false,
  },
  /** Variables */
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  photo: {
    type: String,
    required: false,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  isDemo: {
    type: Boolean,
    required: true,
    default: false,
  },
  /** Push tokens */
  iosPushTokens: [{
    type: String,
    required: true,
    default: [],
    select: false,
  }],
  androidPushTokens: [{
    type: String,
    required: true,
    default: [],
    select: false,
  }],
  webPushTokens: [{
    type: String,
    required: true,
    default: [],
    select: false,
  }],
  /** Projects */
  invites: [{
    type: Schema.ObjectId,
    ref: 'invite',
    required: true,
    default: [],
  }],
  projects: [{
    type: Schema.ObjectId,
    ref: 'project',
    required: true,
    default: [],
  }],
  /** System variables */
  password: {
    type: String,
    select: false,
  },
  token: {
    type: String,
    select: false,
  },
  tokenForPasswordReset: {
    type: String,
    select: false,
  },
  tokenForPasswordResetIsFresh: {
    type: Boolean,
    required: true,
    default: false,
    select: false,
  },
  magicToken: {
    type: String,
    select: false,
  },
});

userSchema.methods.maxNumberOfProjects = (plan) => {
  if (plan === 0) {
    return 1;
  } else if (plan === 1) {
    return 5;
  } else if (plan === 2) {
    return 20;
  } else if (plan === 3) {
    return 50;
  }
  return 1;
};

userSchema.methods.generateResetPasswordToken = (user) => {
  user.tokenForPasswordReset = randomToken(24);
  user.tokenForPasswordResetIsFresh = true;
};

userSchema.methods.generateMagicToken = (user) => {
  user.magicToken = randomToken(24);
};

mongoose.model('user', userSchema);
