const mongoose = require('mongoose');

const productionDetailsSchema = new mongoose.Schema({
  roll_size: {
    type: String,
    required: true
  },
  cylinder_size: {
    type: String,
    required: true
  },
  quantity_kgs: {
    type: Number,
    required: true,
    min: 0
  },
  quantity_rolls: {
    type: Number,
    required: true,
    min: 0
  },
  remarks: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true
  },
  progress: {
    type: String,
    default: "Pending"  // Default value for progress
  },
  remaining_quantity: {
    type: Number,
    required: true,
    min: 0
  },
});

// Schema for the production manager (productionManagerSchema)
const productionManagerSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true  // Ensures the order_id is unique in the collection
  },
  production_type: {
    type: String,
    enum: ['wcut_bagmaking', 'dcut_bagmaking'],  // Defines valid production types
    required: false
  },
  production_details: productionDetailsSchema,  // Embedding the productionDetails schema
  status: {
    type: String,
    default: "pending"  // Default status value
  },
}, { timestamps: true });  // Automatically adds 'createdAt' and 'updatedAt' fields

// Pre-save hook to update the `updatedAt` field before saving
productionManagerSchema.pre('save', function (next) {
  this.updatedAt = new Date();  // Ensures updatedAt is set to the current date
  next();
});

module.exports = productionManagerSchema;