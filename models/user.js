const mongoose = require('mongoose');
const config = require('../config');
const randomToken = require('random-token').create(config.randomTokenSalt);
const jwt = require('jsonwebtoken');
const mailer = require('../helpers/mailer');
const push = require('../helpers/push');

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
  }],
  androidPushTokens: [{
    type: String,
    required: true,
    default: [],
  }],
  webPushTokens: [{
    type: String,
    required: true,
    default: [],
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

/** Generates reset password token and makes it fresh */
userSchema.methods.generateResetPasswordToken = function () {
  const token = randomToken(10);

  this.tokenForPasswordReset = jwt.sign({
    token,
    userid: this._id,
  }, config.jwtSecret, {
    expiresIn: '1d',
  });
  this.tokenForPasswordResetIsFresh = true;
};

/** Generates magic link login token */
userSchema.methods.generateMagicToken = function () {
  const token = randomToken(10);

  this.magicToken = jwt.sign({
    token,
    userid: this._id,
  }, config.jwtSecret, {
    expiresIn: '1d',
  });
};

/** Initiates set password sequence */
userSchema.methods.sendSetPassword = function () {
  this.generateResetPasswordToken();
  mailer.sendSetPassword(this);
  return this.save();
};

/** Sends invite */
userSchema.methods.sendInvite = function (project, type) {
  mailer.sendInvite(this, project, type);
  push.pushInvite([this], project, type);
};

/** Function to get number of max available projects for user */
userSchema.methods.maxProjects = function () {
  switch (this.plan) {
    case 0:
      return 1;
    case 1:
      return 5;
    case 2:
      return 20;
    case 3:
      return 50;
    default:
      return 1;
  }
};

module.exports = mongoose.model('user', userSchema);
