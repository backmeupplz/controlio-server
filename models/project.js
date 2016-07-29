const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  dateCreated: {
    type: Date,
    default: Date.now
  },
  title: String,
  image: String,
  status: String,
  description: String,
  completed: {
    type: Boolean,
    required: true,
    default: false
  },
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
  clients: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
    default: []
  }],
  posts: [{
    type: Schema.ObjectId,
    ref: 'post',
    required: true,
    default: []
  }]
});

mongoose.model('project', projectSchema);