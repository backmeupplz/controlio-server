const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const validate = require('mongoose-validator');

const emailValidator = [
  validate({
    validator: 'isEmail',
    message: 'Wrong email format',
  }),
];

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    validate: emailValidator,
  },
  password: {
    type: String,
    select: false,
  },
  token: {
    type: String,
    select: false,
  },
  isBusiness: {
    type: Boolean,
    required: true,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  addedAsClient: {
    type: Boolean,
    required: true,
    default: false,
  },
  addedAsManager: {
    type: Boolean,
    required: true,
    default: false,
  },
  projects: [{
    type: Schema.ObjectId,
    ref: 'project',
    select: false,
    required: true,
    default: [],
  }],
  managers: [{
    type: Schema.ObjectId,
    ref: 'user',
    select: false,
    required: true,
    default: [],
  }],
  iosPushTokens: [{
    type: String,
    select: false,
    required: true,
    default: [],
  }],
  androidPushTokens: [{
    type: String,
    select: false,
    required: true,
    default: [],
  }],
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
  tokenForPasswordReset: String,
  tokenForPasswordResetIsFresh: {
    type: Boolean,
    required: true,
    default: false,
  },
  magicToken: String,
});

mongoose.model('user', userSchema);
