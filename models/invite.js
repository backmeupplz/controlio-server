const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const inviteSchema = new Schema({
  type: {
    type: String,
    enum: ['manage', 'own', 'client'],
    required: true,
  },
  sender: {
    type: Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  project: {
    type: Schema.ObjectId,
    ref: 'project',
    required: true,
  },
  invitee: {
    type: Schema.ObjectId,
    ref: 'user',
  },
}, { timestamps: true });

mongoose.model('invite', inviteSchema);
