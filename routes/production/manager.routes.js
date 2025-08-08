const express = require("express");
const router = express.Router();
const ProductionManagerController = require("../../controllers/production/manager.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const WCutProductionController = require("../../controllers/admin/production/w-cut.controller");
const DCutProductionController = require("../../controllers/admin/production/d-cut.controller");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// W-Cut Bagmaking routes

router.get(
  "/wcut/bagmaking",
  ProductionManagerController.listWCutBagmaking.bind(
    ProductionManagerController
  )
);
router.put(
  "/update/:order_id",
  ProductionManagerController.updateData.bind(ProductionManagerController)
);
router.get(
  "/get/:order_id",
  ProductionManagerController.getData.bind(ProductionManagerController)
);
router.get(
  "/view/:order_id",
  ProductionManagerController.viewOrderDetails.bind(ProductionManagerController)
);

// D-Cut Bagmaking routes
router.get(
  "/dcut/bagmaking",
  ProductionManagerController.listDCutBagmaking.bind(
    ProductionManagerController
  )
);
// production stats
router.get(
  "/production-stats",
  ProductionManagerController.productionStats.bind(ProductionManagerController)
);
router.get(
  "/w-cut/flexo",
  WCutProductionController.getFlexoPrinting.bind(WCutProductionController)
);
router.get(
  "/w-cut/bag-making",
  WCutProductionController.getBagMaking.bind(WCutProductionController)
);

// D-Cut Production Routes
router.get(
  "/d-cut/opsert",
  DCutProductionController.getOpsertPrinting.bind(DCutProductionController)
);
router.get(
  "/d-cut/bag-making",
  DCutProductionController.getBagMaking.bind(DCutProductionController)
);

// production manager counter
router.get(
  "/w-cut/flexo-counter",
  WCutProductionController.getFlexoCounter.bind(WCutProductionController)
);
router.get(
  "/w-cut/bag-making-counter",
  WCutProductionController.getWCutBagMakingCounter.bind(
    WCutProductionController
  )
);

router.get(
  "/d-cut/opsert-counter",
  DCutProductionController.getDCutOpsertCounter.bind(DCutProductionController)
);
router.get(
  "/d-cut/bag-making-counter",
  DCutProductionController.getDCutBagMakingCounter.bind(
    DCutProductionController
  )
);

module.exports = router;
