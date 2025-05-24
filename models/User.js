const mongoose = require('mongoose');
const userSchema = require('./schemas/user.schema');

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove password
  delete user.__v; // Optional: Remove the __v field if not needed
  return user;
};

// Instance method to check if the user is a production user
userSchema.methods.isProductionUser = function () {
  return this.registrationType === 'production';
};

// Instance method to check if the user is a production manager
userSchema.methods.isProductionManager = function () {
  return this.registrationType === 'production_manager';
};

// Instance method to check if the user is active
userSchema.methods.isActive = function () {
  return this.status === 'active';
};

// Instance method to update the status of the user
userSchema.methods.updateStatus = async function (newStatus) {
  this.status = newStatus;
  return this.save();
};

// Static method to find active users by registration type
userSchema.statics.findActiveByType = function (registrationType) {
  return this.find({
    registrationType,
    status: 'active'
  });
};

// Static method to find users with blank bagType and operatorType
userSchema.statics.findWithBlankFields = function () {
  return this.find({
    bagType: '',
    operatorType: ''
  });
};

// Middleware to automatically update the `updatedAt` field before saving
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to validate bagType and operatorType logic before saving
userSchema.pre('save', function (next) {
  if (this.registrationType === 'production_manager') {
    if (this.bagType || this.operatorType) {
      return next(
        new Error(
          'bagType and operatorType must be blank for production_manager registration type.'
        )
      );
    }
  } else if (this.registrationType === 'production') {
    if (!this.bagType || !this.operatorType) {
      return next(
        new Error(
          'bagType and operatorType are required for production registration type.'
        )
      );
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
