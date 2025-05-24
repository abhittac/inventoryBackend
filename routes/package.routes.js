const express = require('express');
const router = express.Router();
const PackageController = require('../controllers/package.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', PackageController.create.bind(PackageController));
router.get('/order/:orderId', PackageController.getByOrderId.bind(PackageController));
router.put('/:id', PackageController.update.bind(PackageController));

module.exports = router;