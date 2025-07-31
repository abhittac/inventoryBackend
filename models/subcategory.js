const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema(
    {
        fabricColor: {
            type: String,
            required: true,
        },
        rollSize: {
            type: Number,
            required: true,
        },
        gsm: {
            type: Number,
            required: true,
        },
        fabricQuality: {
            type: String,
            required: false,
        },
        quantity: {
            type: Number,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Assuming categories are stored in a Category model
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
    { timestamps: true } // Adds createdAt and updatedAt
);

const Subcategory = mongoose.model('Subcategory', SubcategorySchema);
module.exports = Subcategory;
