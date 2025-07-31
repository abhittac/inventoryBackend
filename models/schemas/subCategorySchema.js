const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema(
  {
    fabricColor: {
      type: String,
      required: [true, "Fabric color is required"],
      trim: true,
    },
    rollSize: {
      type: Number,
      required: [true, "Roll size is required"],
      min: [1, "Roll size must be at least 1"],
    },
    gsm: {
      type: Number,
      required: [true, "GSM is required"],
      min: [1, "GSM must be at least 1"],
    },
    fabricQuality: {
      type: String,
      required: [true, "Fabric quality is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
     is_used: {
            type: Boolean,
            default: false,
      },
      
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubCategory", SubCategorySchema);
