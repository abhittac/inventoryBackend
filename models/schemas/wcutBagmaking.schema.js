const mongoose = require('mongoose');

const wcutBagmakingSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Ensures order_id is unique
  },
  unit_number: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "delivered"],
    default: "pending",
  },
  remarks: {
    type: String,
    trim: true,
    required: false,
  },
  jobName: {
    type: String,
    required: false,
    trim: true
  },
  bagType: {
    type: String,
    required: false,
    trim: true
  },
  operatorName: {
    type: String,
    required: false
  },
  quantity: {
    type: Number,
    required: false,
    min: 0
  },
  remarks: {
    type: String,
    trim: false
  },
  scrapQuantity: {
    type: Number,
    required: false,
    min: 0
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

wcutBagmakingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = wcutBagmakingSchema;