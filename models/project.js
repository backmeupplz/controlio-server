const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  title: String,
  image: String,
  description: String,
  completed: {
    type: Boolean,
    required: true,
    default: false,
  },
  owner: {
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  manager: {
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  clients: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
    default: [],
  }],
  lastStatus: {
    type: Schema.ObjectId,
    ref: 'post',
  },
  lastPost: {
    type: Schema.ObjectId,
    ref: 'post',
  },
  posts: [{
    type: Schema.ObjectId,
    ref: 'post',
    required: true,
    default: [],
  }],
  canEdit: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { timestamps: true });

mongoose.model('project', projectSchema);
