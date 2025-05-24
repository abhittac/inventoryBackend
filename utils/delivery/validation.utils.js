/**
 * Utility functions for delivery data validation
 */
const validateVehicleNumber = (vehicleNumber) => {
  // Basic vehicle number validation - can be customized based on requirements
  const vehicleNumberRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
  return vehicleNumberRegex.test(vehicleNumber);
};

const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity > 0;
};

const validateGSM = (gsm) => {
  return Number.isInteger(gsm) && gsm > 0;
};

module.exports = {
  validateVehicleNumber,
  validateQuantity,
  validateGSM
};