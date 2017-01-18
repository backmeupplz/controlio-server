const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  title: {
    type: String,
    required: true,
    select: false,
  },
  image: {
    type: String,
    select: false,
  },
  description: {
    type: String,
    select: false,
  },
  owner: {
    type: Schema.ObjectId,
    ref: 'user',
    select: false,
  },
  managers: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
    default: [],
    select: false,
  }],
  clients: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
    select: false,
  }],
  invites: [{
    type: Schema.ObjectId,
    ref: 'invite',
    required: true,
    default: [],
    select: false,
  }],
  posts: [{
    type: Schema.ObjectId,
    ref: 'post',
    required: true,
    default: [],
    select: false,
  }],
  lastPost: {
    type: Schema.ObjectId,
    ref: 'post',
    select: false,
  },
  lastStatus: {
    type: Schema.ObjectId,
    ref: 'post',
    select: false,
  },
  isArchived: {
    type: Boolean,
    required: true,
    default: false,
    select: false,
  },
}, { timestamps: true });

mongoose.model('project', projectSchema);
