const express = require('express');
const router = express.Router();
const RawMaterialController = require('../controllers/rawMaterial.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', RawMaterialController.create.bind(RawMaterialController));
router.get('/', RawMaterialController.list.bind(RawMaterialController));
router.put('/:id', RawMaterialController.update.bind(RawMaterialController));

module.exports = router;