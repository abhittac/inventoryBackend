const mongoose = require('mongoose');
const productionManagerSchema = require('./schemas/productionManager.schema');

module.exports = mongoose.model('ProductionManager', productionManagerSchema);