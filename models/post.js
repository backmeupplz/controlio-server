var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
  text: String,
  dateCreated: {
    type: Date
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