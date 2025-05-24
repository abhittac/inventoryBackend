const mongoose = require('mongoose');
const opsertSchema = require('./schemas/opsert.schema');

module.exports = mongoose.model('Opsert', opsertSchema);