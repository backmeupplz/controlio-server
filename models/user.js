var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  photo: String,
  isBusiness: Boolean,
  isCompleted: Boolean,
  isEmailVerified: Boolean,
  projects: [
    {
      type: Schema.ObjectId,
      ref: 'project'
    }
  ]
});

mongoose.model('user', userSchema);