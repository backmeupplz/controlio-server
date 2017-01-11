const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
  type: {
    type: String,
    enum: ['post', 'status'],
    default: 'post',
  },
  text: String,
  author: {
    type: Schema.ObjectId,
    ref: 'user',
  },
  attachments: [String],
}, { timestamps: true });

mongoose.model('post', postSchema);
