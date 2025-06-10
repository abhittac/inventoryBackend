const mongoose = require('mongoose');

const packageDetailsSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  length: {
    type: Number,
    required: false,
    min: 0
  },
  width: {
    type: Number,
    required: false,
    min: 0
  },
  height: {
    type: Number,
    required: false,
    min: 0
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  }
});

const packageSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true
  },
  package_details: [packageDetailsSchema],
  status: {
    type: String,
    required: true,
    enum: ['pending', 'delivery', 'cancelled'], // Valid statuses
    default: 'pending' // Default status is 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

packageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = packageSchema;