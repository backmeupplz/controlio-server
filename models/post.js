const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
  text: String,
  manager: {
    type: Schema.ObjectId,
    ref: 'user',
  },
  project: {
    type: Schema.ObjectId,
    ref: 'project',
  },
  attachments: [String],
}, { timestamps: true });

mongoose.model('post', postSchema);
