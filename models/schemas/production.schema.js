const mongoose = require('mongoose');
const { BAG_TYPES, OPERATOR_TYPES } = require('../../config/constants');

const productionSchema = new mongoose.Schema({
  bagType: {
    type: String,
    enum: Object.values(BAG_TYPES),
    required: true
  },
  operatorType: {
    type: String,
    enum: Object.values(OPERATOR_TYPES),
    required: true
  },
  operatorName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  productionDate: {
    type: Date,
    default: Date.now
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

productionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = productionSchema;