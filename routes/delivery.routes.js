const express = require('express');
const router = express.Router();
const DeliveryQueryController = require('../controllers/delivery/query.controller');
const DeliveryCommandController = require('../controllers/delivery/command.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Query Routes
router.get('/order/:orderId', DeliveryQueryController.getByOrderId.bind(DeliveryQueryController));
router.get('/:id', DeliveryQueryController.getById.bind(DeliveryQueryController));
router.get('/', DeliveryQueryController.list.bind(DeliveryQueryController));

// Command Routes
router.post('/', DeliveryCommandController.create.bind(DeliveryCommandController));
router.put('/:id', DeliveryCommandController.update.bind(DeliveryCommandController));
router.delete('/:id', DeliveryCommandController.delete.bind(DeliveryCommandController));

module.exports = router;