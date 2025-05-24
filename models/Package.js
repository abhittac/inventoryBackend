const mongoose = require('mongoose');
const packageSchema = require('./schemas/package.schema');

module.exports = mongoose.model('Package', packageSchema);