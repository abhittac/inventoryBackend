const mongoose = require('mongoose');
const rawMaterialSchema = require('./schemas/rawMaterial.schema');

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);