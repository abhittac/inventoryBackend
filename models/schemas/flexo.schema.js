const mongoose = require('mongoose');

const flexoSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    trim: true
  },
  unit_number: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'delivered', 'billing'],
    default: 'pending'
  },
  remarks: {
    type: String,
    trim: true,
    required: false
  },
  subcategoryIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory', // Reference to the Subcategory model
      required: true
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

flexoSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = flexoSchema;