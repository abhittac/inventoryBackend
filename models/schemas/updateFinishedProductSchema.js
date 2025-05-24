const mongoose = require('mongoose');
const Joi = require('joi');  // Optional, if you want to use Joi for validation

const FinishedProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL', 'XXL'],  // Modify sizes as necessary
      required: true
    },
    color: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['available', 'out_of_stock', 'discontinued'],  // Modify status options as necessary
      required: true
    },
    created: {
      type: Date,
      default: Date.now
    },
    updated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }  // Automatically manages createdAt and updatedAt
);

const FinishedProduct = mongoose.model('FinishedProduct', FinishedProductSchema);

module.exports = FinishedProduct;