const express = require('express');
const router = express.Router();
const DcutBagmakingController = require('../../controllers/dcut/bagmaking.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const OpsertController = require('../../controllers/opsert.controller'); // Correct import

// Apply authentication middleware to all routes
router.use(authMiddleware);

// D-Cut Bag Making routes

router.get('/bagmaking/:orderId/listMaterials', DcutBagmakingController.listMaterials.bind(DcutBagmakingController));
router.get('/bagmaking/production/records', DcutBagmakingController.getRecordsByType.bind(DcutBagmakingController));
router.get('/opsert/production/records', DcutBagmakingController.getRecordsBagmakingByType.bind(DcutBagmakingController));

router.get('/bagmaking', DcutBagmakingController.list.bind(DcutBagmakingController));
router.post('/bagmaking/:orderId/verify', DcutBagmakingController.verifyOrder.bind(DcutBagmakingController));


router.get('/report', DcutBagmakingController.getReport.bind(DcutBagmakingController));
router.put('/bagmaking/:orderId', DcutBagmakingController.updateDcutBagMakingStatus.bind(DcutBagmakingController));

router.put('/bagmaking/:orderId/opsert', DcutBagmakingController.handleMoveToOpsert.bind(DcutBagmakingController));
router.put('/bagmaking/:orderId/billing', DcutBagmakingController.directBilling.bind(DcutBagmakingController));

router.get('/opsert/orders', OpsertController.listOrders.bind(OpsertController));
router.put('/opsert/orders/:id/status', OpsertController.updateOrderStatus.bind(OpsertController));
router.post('/opsert/orders/:id/move-to-delivery', OpsertController.moveToDelivery.bind(OpsertController));

;
module.exports = router;