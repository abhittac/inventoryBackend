const mongoose = require('mongoose');
const saleSchema = require('./schemas/sale.schema');

module.exports = mongoose.model('SalesOrder', saleSchema);