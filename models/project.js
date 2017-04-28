const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  image: String,
  description: String,
  progressEnabled: {
    type: Boolean,
    required: true,
    default: false,
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100,
  },
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
    default: [],
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
  isFinished: {
    type: Boolean,
    required: true,
    default: false,
  },
  canEdit: Boolean,
}, { timestamps: true });

module.exports = mongoose.model('project', projectSchema);
