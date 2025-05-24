const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  bagDetails: {
    type: {
      type: String,
      required: false
    },
    handleColor: String,
    size: {
      type: String,
      required: false
    },
    color: String,
    printColor: String,
    gsm: {
      type: Number,
      required: false
    }
  },
  jobName: {
    type: String,
    required: false
  },
  fabricQuality: {
    type: String,
    required: false
  },
  quantity: {
    type: Number,
    required: false,
    min: 1
  },
  deliveryDate: {
    type: Date,
    required: false
  },
  vehicleNo: String,
  driverName: String,
  driverContact: String,
  notes: {
    type: String,
    trim: false
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'cancelled', 'done'],
    default: 'pending'
  },
  isDeleted: {
    type: Boolean,
    default: false
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

deliverySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = deliverySchema;
