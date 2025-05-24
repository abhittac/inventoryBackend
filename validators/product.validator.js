const Joi = require('joi');

// Define the validation schema for FinishedProduct
const updateFinishedProductSchema = Joi.object({
  name: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  quantity: Joi.number().min(1).optional(),
  size: Joi.string().valid('S', 'M', 'L', 'XL', 'XXL').optional(),
  color: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  status: Joi.string().valid('available', 'out_of_stock', 'discontinued').optional(),
});

module.exports = updateFinishedProductSchema;
