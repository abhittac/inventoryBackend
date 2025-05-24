const mongoose = require('mongoose');
const productionSchema = require('./schemas/production.schema');

module.exports = mongoose.model('Production', productionSchema);