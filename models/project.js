var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var projectSchema = new Schema({
  dateCreated: {
    type: Date
  },
  title: String,
  status: String,
  description: String,
  completed: Boolean,
  managers: [
    {
      type: Schema.ObjectId,
      ref: 'user'
    }
  ],
  clients: [
    {
      type: Schema.ObjectId,
      ref: 'user'
    }
  ],
  posts: [
    {
      type: Schema.ObjectId,
      ref: 'post'
    }
  ],
  lastPost: {
    type: Schema.ObjectId,
    ref: 'post'
  }
});

mongoose.model('project', projectSchema);