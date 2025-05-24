const mongoose = require('mongoose');

const finishedProductSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

finishedProductSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = finishedProductSchema;