const Joi = require('joi');

const createDeliverySchema = Joi.object({
  customerName: Joi.string().required(),
  email: Joi.string().email().required(),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  address: Joi.string().required(),
  bagType: Joi.string().required(),
  handleColor: Joi.string(),
  size: Joi.string().required(),
  jobName: Joi.string().required(),
  bagColor: Joi.string(),
  printColor: Joi.string(),
  gsm: Joi.number().required(),
  fabricQuality: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  vehicleNumber: Joi.string().required(),
  notes: Joi.string(),
  status: Joi.string().valid('pending', 'in_transit', 'delivered', 'cancelled')
});

const updateDeliverySchema = Joi.object({
  vehicleNo: Joi.string().trim().messages({
    'string.base': 'Vehicle number must be a string.',
    'string.empty': 'Vehicle number cannot be empty.',
  }),

  driverName: Joi.string().trim().messages({
    'string.base': 'Driver name must be a string.',
    'string.empty': 'Driver name cannot be empty.',
  }),

  driverContact: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.base': 'Driver contact must be a string of numbers.',
      'string.empty': 'Driver contact cannot be empty.',
      'string.pattern.base': 'Driver contact must be exactly 10 digits.',
    }),

  deliveryDate: Joi.date().messages({
    'date.base': 'Delivery date must be a valid date.',
  }),

  status: Joi.string()
    .valid('pending', 'in_transit', 'delivered', 'cancelled')
    .optional()
    .messages({
      'string.base': 'Status must be a string.',
      'any.only': 'Status must be one of: pending, in_transit, delivered, cancelled.',
    }),

}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  createDeliverySchema,
  updateDeliverySchema
};