var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  token: {
    type: String,
    required: true,
    select: false
  },
  isBusiness: {
    type: Boolean,
    required: true,
    default: false
  },
  admin: {
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