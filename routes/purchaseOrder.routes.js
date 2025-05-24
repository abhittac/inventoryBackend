const express = require('express');
const router = express.Router();
const PurchaseOrderController = require('../controllers/purchaseOrder.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', PurchaseOrderController.create.bind(PurchaseOrderController));
router.get('/', PurchaseOrderController.list.bind(PurchaseOrderController));

module.exports = router;