const mongoose = require('mongoose');
const invoiceSchema = require('./schemas/invoice.schema');

module.exports = mongoose.model('Invoice', invoiceSchema);