const express = require('express');
const router = express.Router();

const authMiddleware = require('../../middleware/auth.middleware');
const WcutBagmakingController = require('../../controllers/wcut/WcutBagmakingController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// W-Cut Bag Making routes

router.get('/flexo/:orderId/listMaterials', WcutBagmakingController.listMaterials.bind(WcutBagmakingController));
router.get('/flexo/production/records', WcutBagmakingController.getRecordsByType.bind(WcutBagmakingController));
router.delete('/flexo/production/:orderId', WcutBagmakingController.deleteRecord.bind(WcutBagmakingController));

router.get('/flexo', WcutBagmakingController.list.bind(WcutBagmakingController));
router.post('/flexo/:orderId/verify', WcutBagmakingController.verifyOrder.bind(WcutBagmakingController));

router.put('/flexo/:orderId/bag_making', WcutBagmakingController.handleMoveToBagmaking.bind(WcutBagmakingController));


// router.get('/report', WcutBagmakingController.getReport.bind(WcutBagmakingController));
router.put('/flexo/:orderId', WcutBagmakingController.updateProductionManagerStatus.bind(WcutBagmakingController));

router.put('/flexo/:orderId/billing', WcutBagmakingController.directBilling.bind(WcutBagmakingController));


router.get('/bagmaking/orders', WcutBagmakingController.listOrders.bind(WcutBagmakingController));
router.put('/bagmaking/orders/:id/status', WcutBagmakingController.updateOrderStatus.bind(WcutBagmakingController));
router.post('/bagmaking/orders/:id/move-to-delivery', WcutBagmakingController.moveToDelivery.bind(WcutBagmakingController));

router.get('/bagmaking/production/records', WcutBagmakingController.getRecordsBagmakingByType.bind(WcutBagmakingController));
module.exports = router;