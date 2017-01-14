const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  createdType: {
    type: String,
    enum: ['managerCreated', 'clientCreated'],
  },
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
  ownerInvited: {
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
  managersInvited: [{
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
  clientsInvited: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
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
