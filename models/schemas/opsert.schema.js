const mongoose = require('mongoose');

const opsertSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

opsertSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = opsertSchema;