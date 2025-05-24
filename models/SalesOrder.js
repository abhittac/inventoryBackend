const mongoose = require('mongoose');
const salesOrderSchema = require('./schemas/salesOrder.schema');

module.exports = mongoose.model('SalesOrder', salesOrderSchema);