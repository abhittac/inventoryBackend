const mongoose = require('mongoose');
const finishedProductSchema = require('./schemas/finishedProduct.schema');

module.exports = mongoose.model('FinishedProduct', finishedProductSchema);