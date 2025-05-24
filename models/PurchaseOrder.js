const mongoose = require('mongoose');
const purchaseOrderSchema = require('./schemas/purchaseOrder.schema');  // Correct import

// Defining the model with the schema
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
