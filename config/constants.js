const REGISTRATION_TYPES = {
  ADMIN: 'admin',
  SALES: 'sales',
  DELIVERY: 'delivery',
  PRODUCTION: 'production',
  PRODUCTION_MANAGER: 'production_manager',
  INVENTORY: 'inventory',
};

const BAG_TYPES = {
  W_CUT: 'w_cut',
  D_CUT: 'd_cut'
};

const OPERATOR_TYPES = {
  FLEXO_PRINTING: 'flexo_printing',
  BAG_MAKING: 'bag_making',
  OPSERT_PRINTING: 'opsert_printing'
};

// Define valid operator types for each bag type
const BAG_TYPE_OPERATORS = {
  [BAG_TYPES.W_CUT]: [OPERATOR_TYPES.FLEXO_PRINTING, OPERATOR_TYPES.BAG_MAKING],
  [BAG_TYPES.D_CUT]: [OPERATOR_TYPES.OPSERT_PRINTING, OPERATOR_TYPES.BAG_MAKING]
};

module.exports = {
  REGISTRATION_TYPES,
  OPERATOR_TYPES,
  BAG_TYPES,
  BAG_TYPE_OPERATORS
};