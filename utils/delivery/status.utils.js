/**
 * Utility functions for delivery status management
 */
const DELIVERY_STATUSES = {
  PENDING: 'pending',
  IN_TRANSIT: 'in transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const isValidStatus = (status) => {
  return Object.values(DELIVERY_STATUSES).includes(status);
};

const canTransitionStatus = (currentStatus, newStatus) => {
  const validTransitions = {
    [DELIVERY_STATUSES.PENDING]: [DELIVERY_STATUSES.IN_TRANSIT, DELIVERY_STATUSES.CANCELLED],
    [DELIVERY_STATUSES.IN_TRANSIT]: [DELIVERY_STATUSES.DELIVERED, DELIVERY_STATUSES.CANCELLED],
    [DELIVERY_STATUSES.DELIVERED]: [],
    [DELIVERY_STATUSES.CANCELLED]: []
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

module.exports = {
  DELIVERY_STATUSES,
  isValidStatus,
  canTransitionStatus
};