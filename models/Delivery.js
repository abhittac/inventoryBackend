const mongoose = require('mongoose');
const deliverySchema = require('./schemas/delivery.schema');

// Add any delivery-specific methods here
deliverySchema.methods.isDelivered = function() {
  return this.status === 'delivered';
};

// Add any static methods here
deliverySchema.statics.findActiveDeliveries = function() {
  return this.find({ 
    isDeleted: false,
    status: { $ne: 'cancelled' }
  });
};

module.exports = mongoose.model('Delivery', deliverySchema);