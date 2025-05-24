const mongoose = require('mongoose');
const { REGISTRATION_TYPES, OPERATOR_TYPES, BAG_TYPES } = require('../../config/constants');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String
  },
  registrationType: {
    type: String,
    required: true,
    enum: Object.values(REGISTRATION_TYPES)
  },
  bagType: {
    type: String,
    enum: [...Object.values(BAG_TYPES), ''],
    default: '',
    validate: {
      validator: function (value) {
        if (this.registrationType === REGISTRATION_TYPES.PRODUCTION) {
          return Object.values(BAG_TYPES).includes(value);
        }
        return value === '';
      },
      message: props =>
        props.value === '' ?
          'bagType is required for production users' :
          'bagType must be blank for non-production users'
    }
  },
  operatorType: {
    type: String,
    enum: [...Object.values(OPERATOR_TYPES), ''],
    default: '',
    validate: {
      validator: function (value) {
        if (this.registrationType === REGISTRATION_TYPES.PRODUCTION) {
          return Object.values(OPERATOR_TYPES).includes(value);
        }
        return value === '';
      },
      message: props =>
        props.value === '' ?
          'operatorType is required for production users' :
          'operatorType must be blank for non-production users'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = userSchema;