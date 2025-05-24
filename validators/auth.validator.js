const Joi = require('joi');
const { REGISTRATION_TYPES, OPERATOR_TYPES, BAG_TYPES, BAG_TYPE_OPERATORS } = require('../config/constants');
const registrationSchema = Joi.object({
  fullName: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.ref('password'),
  address: Joi.string().allow(''),
  registrationType: Joi.string()
    .valid(...Object.values(REGISTRATION_TYPES))
    .required(),
  bagType: Joi.string()
    .valid(...Object.values(BAG_TYPES), '')
    .when('registrationType', {
      is: REGISTRATION_TYPES.PRODUCTION,
      then: Joi.required(),
      otherwise: Joi.valid('') // bagType must be blank for production_manager or others
    }),
  operatorType: Joi.string()
    .valid(...Object.values(OPERATOR_TYPES), '')
    .when('registrationType', {
      is: REGISTRATION_TYPES.PRODUCTION,
      then: Joi.required().custom((value, helpers) => {
        const bagType = helpers.state.ancestors[0].bagType;
        if (!bagType) return value;

        const validOperators = BAG_TYPE_OPERATORS[bagType];
        if (!validOperators.includes(value)) {
          return helpers.error('any.invalid', { value });
        }
        return value;
      }),
      otherwise: Joi.valid('') // operatorType must be blank for production_manager or others
    })
}).with('password', 'confirmPassword');


const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = {
  registrationSchema,
  loginSchema
};