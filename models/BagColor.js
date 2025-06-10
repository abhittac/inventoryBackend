const mongoose = require('mongoose');

const BagColorSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('BagColor', BagColorSchema);
