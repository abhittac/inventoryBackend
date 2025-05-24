const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  supplier: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'ordered', 'received', 'cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    required: true
  },
  order_number: {
    type: String,
    required: true
  },
  materialType: {
    type: String,
    required: true
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

purchaseOrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = purchaseOrderSchema;
