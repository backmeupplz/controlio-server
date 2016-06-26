var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validate = require('mongoose-validator');

var emailValidator = [
  validate({
    validator: 'isEmail',
    message: 'Wrong email format'
  })
];

var userSchema = new Schema({
  email: {
    type: String,
    required: true,
    validate: emailValidator
  },
  password: {
    type: String,
    required: false,
    select: false
  },
  token: {
    type: String,
    required: false,
    select: false
  },
  isBusiness: {
    type: Boolean,
    required: true,
    default: false
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  addedAsClient: {
    type: Boolean,
    required: true,
    default: false
  },
  addedAsManager: {
    type: Boolean,
    required: true,
    default: false
  },
  projects: [
    {
      type: Schema.ObjectId,
      ref: 'project',
      required: true,
      default: []
    }
  ],
  iosPushTokens: [
    {
      type: String,
      required: true,
      default: []
    }
  ],
  androidPushTokens: [
    {
      type: String,
      required: true,
      default: []
    }
  ],
  name: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  }
});

mongoose.model('user', userSchema);