const express = require('express');
const router = express.Router();
const WCutProductionController = require('../../controllers/admin/production/w-cut.controller');
const DCutProductionController = require('../../controllers/admin/production/d-cut.controller');

// W-Cut Production Routes
router.get('/w-cut/flexo', WCutProductionController.getFlexoPrinting.bind(WCutProductionController));
router.get('/w-cut/bag-making', WCutProductionController.getBagMaking.bind(WCutProductionController));

// D-Cut Production Routes
router.get('/d-cut/opsert', DCutProductionController.getOpsertPrinting.bind(DCutProductionController));
router.get('/d-cut/bag-making', DCutProductionController.getBagMaking.bind(DCutProductionController));


module.exports = router;