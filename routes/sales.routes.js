const express = require("express");
const router = express.Router();
const SalesOrderController = require("../controllers/salesOrder.controller");
const authMiddleware = require("../middleware/auth.middleware");

const salesActionController = require("../controllers/admin/salesController");
// Apply authentication middleware to all routes
router.use(authMiddleware);

// Sales Order Routes
router.get(
  "/orders/stats",
  SalesOrderController.getSalesOrderStats.bind(SalesOrderController)
);
router.post(
  "/orders",
  SalesOrderController.createOrder.bind(SalesOrderController)
);
router.get(
  "/recentOrders",
  SalesOrderController.recentOrders.bind(SalesOrderController)
);
router.get(
  "/orders",
  SalesOrderController.getOrders.bind(SalesOrderController)
);
router.get(
  "/orders/:id",
  SalesOrderController.getOrderById.bind(SalesOrderController)
);
router.put(
  "/orders/:id",
  SalesOrderController.updateOrder.bind(SalesOrderController)
);
router.delete(
  "/orders/:id",
  SalesOrderController.deleteOrder.bind(SalesOrderController)
);
router.get(
  "/orders/get/mobile-numbers",
  SalesOrderController.getOrdersByMobileNumber.bind(SalesOrderController)
);
router.get(
  "/orders/list/mobile-numbers",
  SalesOrderController.listAllMobileNumbers.bind(SalesOrderController)
);

router.get("/bag-attributes", salesActionController.getAllAttributes);

module.exports = router;
