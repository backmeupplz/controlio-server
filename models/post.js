const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  text: String,
  dateCreated: {
    type: Date,
    default: Date.now
  },
  manager: {
    type: Schema.ObjectId,
    ref: 'user'
  },
  project: {
    type: Schema.ObjectId,
    ref: 'project'
  },
  attachments: [String]
});

mongoose.model('post', postSchema);