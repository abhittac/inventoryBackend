const { string } = require('joi');
const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  bagDetails: {
    type: { type: String, required: true, lowercase: true },
    handleColor: { type: String, trim: true, lowercase: true },
    size: { type: String, required: true, trim: true, lowercase: true },
    color: { type: String, trim: true, lowercase: true },
    printColor: { type: String, trim: true, lowercase: true },
    gsm: { type: Number, required: true, min: 10, lowercase: true }
  },
  jobName: {
    type: String,
    required: true,
    lowercase: true
  },
  fabricQuality: {
    type: String,
    required: true,
    lowercase: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  agent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  orderPrice: {
    type: String,
    unique: true,
    required: true
  },
  gstNo: { type: String },
  contactPerson: { type: String },
  remarks: { type: String },
  productionManager: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionManager' },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

salesOrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = salesOrderSchema;