const Delivery = require("../models/Delivery");
const SalesOrder = require("../models/SalesOrder");
const User = require("../models/User");
const UserService = require("../services/user.service");
const logger = require("../utils/logger");

class AdminController {
  async getUsers(req, res) {
    try {
      const { search, status } = req.query;
      const users = await UserService.getUsers({ search, status });

      // Ensure newest users are on top if DB doesn't handle it
      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async dashboardOverview(req, res) {
    try {
      // Fetch all completed sales orders with only the 'orderPrice' field
      const salesOrders = await SalesOrder.find(
        { status: "completed" }, // Filter condition
        { orderPrice: 1, _id: 0 } // Select only orderPrice field
      );

      // Ensure orderPrice values are treated as numbers
      const totalOrderValue = salesOrders.reduce(
        (sum, order) => sum + Number(order.orderPrice || 0),
        0
      );

      console.log("Total Order Value:", totalOrderValue);

      // Fetch total pending deliveries
      const totalPendingDeliveries = await Delivery.countDocuments({
        status: "pending",
      });

      // Fetch total active users
      const totalActiveUsers = await User.countDocuments({ status: "active" });

      // Fetch total number of sales orders
      const totalSalesOrders = await SalesOrder.countDocuments();

      // Return the structured response
      res.status(200).json({
        success: true,
        data: {
          totalOrderValue,
          totalPendingDeliveries,
          totalActiveUsers,
          totalSalesOrders,
        },
      });
    } catch (error) {
      logger.error("error fetching overview", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error("Error fetching user by ID:", error);
      res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createUser(req, res) {
    try {
      const userData = req.body;
      if (req.file) {
        userData.profileImage = req.file.path;
      }

      const user = await UserService.createUser(userData);
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error("Error creating user:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const user = await UserService.updateUser(id, userData);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error("Error updating user:", error);
      res.status(error.message === "User not found" ? 404 : 400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);

      res.json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      logger.error("Error deleting user:", error);
      res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AdminController();
