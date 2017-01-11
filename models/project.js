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
  ownerInvited: {
    type: Schema.ObjectId,
    ref: 'user',
  },
  managers: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
    default: [],
  }],
  managersInvited: [{
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
  clientsInvited: [{
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
  }],
  posts: [{
    type: Schema.ObjectId,
    ref: 'post',
    required: true,
    default: [],
  }],
  isArchived: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { timestamps: true });

mongoose.model('project', projectSchema);
