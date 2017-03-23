const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
  type: {
    type: String,
    enum: ['post', 'status'],
    default: 'post',
    required: true,
  },
  isEdited: {
    type: Boolean,
    required: true,
    default: false,
  },
  text: String,
  author: {
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  attachments: [{
    type: String,
    required: true,
    default: [],
  }],
}, { timestamps: true });

mongoose.model('post', postSchema);
