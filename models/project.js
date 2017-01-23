const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  image: String,
  description: String,
  owner: {
    type: Schema.ObjectId,
    ref: 'user',
  },
  managers: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
    default: [],
  }],
  clients: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
  }],
  invites: [{
    type: Schema.ObjectId,
    ref: 'invite',
    required: true,
    default: [],
  }],
  posts: [{
    type: Schema.ObjectId,
    ref: 'post',
    required: true,
    default: [],
  }],
  lastPost: {
    type: Schema.ObjectId,
    ref: 'post',
  },
  lastStatus: {
    type: Schema.ObjectId,
    ref: 'post',
  },
  isArchived: {
    type: Boolean,
    required: true,
    default: false,
  },
  canEdit: Boolean,
}, { timestamps: true });

mongoose.model('project', projectSchema);
