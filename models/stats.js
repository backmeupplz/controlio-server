const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const statsSchema = new Schema({
  numberOfFriendDiscountsLeft: {
    type: Number,
    reuired: true,
    default: 1000,
  },
}, { timestamps: true });

module.exports = mongoose.model('stats', statsSchema);
