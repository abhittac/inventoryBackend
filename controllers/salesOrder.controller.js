const SalesOrderService = require("../services/salesOrder.service");
const { salesOrderSchema } = require("../validators/salesOrder.validator");
const logger = require("../utils/logger");
const ProductionManager = require("../models/ProductionManager");
const SalesOrder = require("../models/SalesOrder");

class SalesOrderController {
  async createOrder(req, res) {
    try {
      const { error, value } = salesOrderSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      }

      const order = await SalesOrderService.createOrder(value);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      logger.error("Error in create order controller:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async getOrders(req, res) {
    try {
      const { status, agent } = req.query;
      const orders = await SalesOrderService.getOrders({ status, agent });

      // Sorting orders by createdAt in descending order
      const sortedOrders = orders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      res.json({
        success: true,
        data: sortedOrders,
        response: "checlked",
      });
    } catch (error) {
      logger.error("Error in get orders controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async getSalesOrderStats(req, res) {
    try {
      console.log("inside getSalesOrderStats controller:");
      const stats = await SalesOrderService.getSalesOrderStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error in getSalesOrderStats controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async recentOrders(req, res) {
    try {
      const orders = await SalesOrderService.recentOrders();

      // Sorting orders by createdAt in descending order
      const sortedOrders = orders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      res.json({
        success: true,
        data: sortedOrders,
      });
    } catch (error) {
      logger.error("Error in recent orders controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const order = await SalesOrderService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (error) {
      logger.error("Error in get order by id controller:", error);
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // async updateOrder(req, res) {
  //   try {
  //     const { error, value } = salesOrderSchema.validate(req.body);
  //     if (error) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: error.details[0].message });
  //     }

  //     const order = await SalesOrderService.updateOrder(req.params.id, value);
  //     res.json({
  //       success: true,
  //       data: order,
  //       message: "Order updated successfully",
  //     });
  //   } catch (error) {
  //     logger.error("Error in update order controller:", error);
  //     res.status(404).json({ success: false, message: error.message });
  //   }
  // }
  async updateOrder(req, res) {
    try {
      const { error, value } = salesOrderSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      }

      const order = await SalesOrder.findByIdAndUpdate(req.params.id, value, {
        new: true,
      });

      // Update the quantity in the production_manager collection
      const productionManager = await ProductionManager.findOne({
        order_id: order.orderId,
      });
      if (productionManager) {
        productionManager.production_details.quantity_kgs = order.quantity;
        await productionManager.save();
      }

      res.json({
        success: true,
        data: order,
        message: "Order updated successfully",
      });
    } catch (error) {
      logger.error("Error in update order controller:", error);
      res.status(404).json({ success: false, message: error.message });
    }
  }
  async deleteOrder(req, res) {
    try {
      await SalesOrderService.deleteOrder(req.params.id);
      res.json({ success: true, message: "Order cancelled successfully" });
    } catch (error) {
      logger.error("Error in delete order controller:", error);
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async getOrdersByMobileNumber(req, res) {
    try {
      const { mobileNumber } = req.query; // Expect mobileNumber as query param

      // Ensure mobileNumber is provided
      if (!mobileNumber) {
        return res
          .status(400)
          .json({ success: false, message: "Mobile number is required" });
      }

      // Log mobileNumber for debugging
      console.log("Fetching orders for mobile number:", mobileNumber);

      // Query orders by mobileNumber using the service method
      const orders = await SalesOrderService.findOrdersByMobileNumber(
        mobileNumber
      );

      // If no orders found, return 404
      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No orders found for this mobile number",
        });
      }

      // Return the orders
      res.json({ success: true, data: orders });
    } catch (error) {
      // Log any errors that occur
      logger.error("Error fetching orders by mobile number:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
  // SalesOrderController.js
  async listAllMobileNumbers(req, res) {
    try {
      // Query to get all distinct mobile numbers from orders
      const mobileNumbers = await SalesOrderService.findAllMobileNumbers(); // Use Mongoose's distinct to get unique mobile numbers

      if (mobileNumbers.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No mobile numbers found" });
      }

      res.json({ success: true, data: mobileNumbers });
    } catch (error) {
      logger.error("Error fetching mobile numbers:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
}

module.exports = new SalesOrderController();
