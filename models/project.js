var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var projectSchema = new Schema({
  dateCreated: {
    type: Date
  },
  title: String,
  image: String,
  status: String,
  description: String,
  completed: Boolean,
  owner: {
    type: Schema.ObjectId,
    ref: 'user',
    required: true
  },
  manager: {
      type: Schema.ObjectId,
      ref: 'user',
      required: true
    },
  clients: [
    {
      type: Schema.ObjectId,
      ref: 'user',
      required: true,
      default: []
    }
  ],
  posts: [
    {
      type: Schema.ObjectId,
      ref: 'post',
      required: true,
      default: []
    }
  ],
  lastPost: {
    type: Schema.ObjectId,
    ref: 'post'
  }
});

mongoose.model('project', projectSchema);