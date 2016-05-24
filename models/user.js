var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  },
  isBusiness: {
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
    ]
});

mongoose.model('user', userSchema);