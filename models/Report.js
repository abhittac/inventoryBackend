
const mongoose = require('mongoose');

const OpsertReportSchema = new mongoose.Schema({
    order_id: { type: String, required: true },
    status: { type: String, enum: ['pending', 'progress', 'completed'], default: 'pending' },
    type: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', OpsertReportSchema);