const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const SalesController = require('../controllers/admin/sales.controller');
const DeliveryController = require('../controllers/admin/delivery.controller');
const productionRoutes = require('./admin/production.routes');
const adminAuthMiddleware = require('../middleware/adminAuth.middleware');

const salesActionController = require('../controllers/admin/salesController');
const upload = require('../middleware/upload');

// Apply admin authentication middleware to all routes
router.use(adminAuthMiddleware);

// User management routes

router.get('/dashboardOverview', AdminController.dashboardOverview.bind(AdminController));
router.get('/users', AdminController.getUsers.bind(AdminController));
router.get('/users/:id', AdminController.getUserById.bind(AdminController));
router.post('/users',
  upload.single('profileImage'),
  AdminController.createUser.bind(AdminController)
);
router.put('/users/:id', AdminController.updateUser.bind(AdminController));
router.delete('/users/:id', AdminController.deleteUser.bind(AdminController));

// Sales routes
router.get('/sales', SalesController.getSales.bind(SalesController));
router.get('/sales/:id', SalesController.getOrderById.bind(SalesController));
router.put('/sales/:id', SalesController.updateOrder.bind(SalesController));
router.delete('/sales/:id', SalesController.deleteOrder.bind(SalesController));

// Delivery routes
router.get('/delivery', DeliveryController.getDeliveries.bind(DeliveryController));
router.get('/delivery/:id', DeliveryController.getById.bind(DeliveryController));
router.put('/delivery/:id', DeliveryController.update.bind(DeliveryController));
router.delete('/delivery/:id', DeliveryController.delete.bind(DeliveryController));

router.get('/:type', salesActionController.getAll);
router.get('/:type/:id', salesActionController.getById);
router.post('/:type', salesActionController.create);
router.put('/:type/:id', salesActionController.update);
router.delete('/:type/:id', salesActionController.delete);


// Production routes
router.use('/production', productionRoutes);

module.exports = router;