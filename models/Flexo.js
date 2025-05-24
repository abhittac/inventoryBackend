const mongoose = require('mongoose');
const flexoSchema = require('./schemas/flexo.schema');

module.exports = mongoose.model('Flexo', flexoSchema);