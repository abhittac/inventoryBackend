const Joi = require('joi');

// Define bagDetails schema for Joi validation
const bagDetailsSchema = Joi.object({
    type: Joi.string().required().messages({
        "string.empty": "Bag type is required."
    }),
    handleColor: Joi.string().allow('').optional().messages({
    "string.base": "Handle color must be a string.",
    }),

    size: Joi.string().required().messages({
        "string.empty": "Bag size is required."
    }),
    color: Joi.string().allow("").messages({
        "string.base": "Bag color must be a string."
    }),
    printColor: Joi.string().allow("").messages({
        "string.base": "Print color must be a string."
    }),
    gsm: Joi.number().required().min(10).messages({
        "number.base": "GSM must be a number.",
        "number.empty": "GSM is required.",
        "number.min": "GSM value must be at least 10."
    }),
});

// Define the main salesOrder schema for Joi validation
const salesOrderSchema = Joi.object({
    customerName: Joi.string().required().messages({
        "string.empty": "Customer name is required."
    }),
  email: Joi.string().email().allow('').optional().messages({
    "string.email": "Enter a valid email address.",
    }),

    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        "string.pattern.base": "Mobile number must be exactly 10 digits.",
        "string.empty": "Mobile number is required."
    }),
    address: Joi.string().required().messages({
        "string.empty": "Address is required."
    }),
    bagDetails: bagDetailsSchema.required().messages({
        "object.base": "Bag details are required."
    }),
    jobName: Joi.string().required().messages({
        "string.empty": "Job name is required."
    }),
    fabricQuality: Joi.string().required().messages({
        "string.empty": "Fabric quality is required."
    }),
    quantity: Joi.number().min(1).required().messages({
        "number.base": "Quantity must be a number.",
        "number.empty": "Quantity is required.",
        "number.min": "Quantity must be at least 1."
    }),
    agent: Joi.string().required().messages({
        "string.empty": "Agent name is required."
    }),
    status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled').messages({
        "any.only": "Status must be one of: pending, processing, completed, cancelled."
    }),
    gstNo: Joi.string()
        .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .optional()
        .allow('')
        .messages({
            'string.pattern.base': 'GST number must be a valid 15-character alphanumeric code in the correct format.'
        }),
    contactPerson: Joi.string().optional().allow(''),
    remarks: Joi.string().optional().allow(''),
    orderPrice: Joi.number().positive().precision(2).required().messages({
        "number.base": "Order price must be a number.",
        "number.empty": "Order price is required.",
        "number.positive": "Order price must be greater than zero.",
        "number.precision": "Order price can have up to two decimal places."
    }),
});

module.exports = {
    salesOrderSchema
};