const mongoose = require("mongoose");

const rawMaterialSchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  fabric_quality: {
    type: String,
    required: true,
    trim: true,
  },
  roll_size: {
    type: String,
    required: true,
  },
  gsm: {
    type: Number,
    required: true,
  },
  fabric_color: {
    type: String,
    required: true,
  },
  quantity_kgs: {
    type: Number,
    required: false,
    min: 0,
  },
  subCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

rawMaterialSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = rawMaterialSchema;
