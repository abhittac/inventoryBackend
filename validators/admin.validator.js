const Joi = require('joi');
const { REGISTRATION_TYPES } = require('../config/constants');

const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/),
  address: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  registrationType: Joi.string().valid(...Object.values(REGISTRATION_TYPES))
}).min(1); // Require at least one field to be present

module.exports = {
  updateUserSchema
};