const SalesOrder = require("../models/SalesOrder");
const logger = require("../utils/logger");

const emailHelper = require("../controllers/helpers/emailHelper");
const ProductionManager = require("../models/ProductionManager");
class SalesOrderService {
  // Helper function to generate unique order ID
  async generateOrderId() {
    const lastOrder = await SalesOrder.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;

    if (lastOrder && lastOrder.orderId) {
      const lastNumber = parseInt(lastOrder.orderId.replace(/^TIPL/, ""), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, "0");
    return `TIPL${paddedNumber}`;
  }

  async createOrder(orderData) {
    try {
      const uniqueOrderId = await this.generateOrderId(); // <- FIXED: await added
      console.log("uniqueOrderId", uniqueOrderId);
      console.log("orderData", orderData);
      // return false;
      const order = new SalesOrder({
        customerName: orderData.customerName,
        email: orderData.email,
        mobileNumber: orderData.mobileNumber,
        address: orderData.address,
        gstNo: orderData.gstNo || "",
        contactPerson: orderData.contactPerson || "",
        remarks: orderData.remarks || "",
        orderPrice: orderData.orderPrice,
        bagDetails: {
          type: orderData.bagDetails.type, // Correct field names
          handleColor: orderData.bagDetails.handleColor,
          size: orderData.bagDetails.size,
          color: orderData.bagDetails.color,
          printColor: orderData.bagDetails.printColor,
          gsm: orderData.bagDetails.gsm,
        },
        jobName: orderData.jobName,
        fabricQuality: orderData.fabricQuality,
        quantity: orderData.quantity,
        agent: orderData.agent,
        status: orderData.status || "pending",
        orderId: uniqueOrderId,
      });
      const savedOrder = await order.save();
      console.log("✅ Sales Order Created:", savedOrder);

      // 3️⃣ Send Sales Overview Email
      try {
        await emailHelper.sendSalesOverviewEmail(savedOrder);
        console.log("✅ Sales Overview Email Sent Successfully");
      } catch (emailError) {
        console.error("⚠️ Failed to send sales overview email:", emailError);
      }

      return savedOrder;
    } catch (error) {
      console.error("Error creating sales order:", error);
      throw error;
    }
  }

  async getOrders({ status, agent }) {
    try {
      const query = {};
      if (status) query.status = status;
      if (agent) query.agent = agent;

      const orders = await SalesOrder.find(query); // Removed pagination logic

      return orders;
    } catch (error) {
      logger.error("Error fetching sales orders:", error);
      throw error;
    }
  }
  async recentOrders() {
    try {
      // Fetch the 5 most recent orders, ordered by creation date
      const orders = await SalesOrder.find().sort({ createdAt: -1 }).limit(5); // sorted by `createdAt` in descending order
      return orders;
    } catch (error) {
      logger.error("Error fetching recent orders:", error);
      throw error;
    }
  }

  async getOrdersList({ status, agent, type }) {
    try {
      const query = {};
      if (status) query.status = status;
      if (agent) query.agent = agent;
      if (type) query["bagDetails.type"] = type; // Ensure the type matches

      // Fetch orders and apply descending order by createdAt
      const orders = await SalesOrder.find(query).sort({ createdAt: -1 }); // Sort in descending order

      return {
        data: orders,
      };
    } catch (error) {
      logger.error("Error fetching sales orders:", error);
      throw error;
    }
  }

  async getSalesOrderStats() {
    try {
      function getPercentageChange(current, previous) {
        if (previous === 0) return current === 0 ? "0%" : "100%";
        const change = ((current - previous) / previous) * 100;
        return `${change.toFixed(2)}%`;
      }

      const now = new Date();
      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const allOrders = await SalesOrder.find({});

      // 🔹 Month-wise filters
      const currentMonthOrders = allOrders.filter(
        (order) => order.createdAt >= startOfCurrentMonth
      );

      const lastMonthOrders = allOrders.filter(
        (order) =>
          order.createdAt >= startOfLastMonth &&
          order.createdAt <= endOfLastMonth
      );

      // 🔹 ALL TIME TOTALS
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(
        (o) => o.status === "pending"
      ).length;
      const completedOrders = allOrders.filter(
        (o) => o.status === "completed"
      ).length;
      const cancelledOrders = allOrders.filter(
        (o) => o.status === "cancelled"
      ).length;
      const totalAmount = allOrders.reduce((acc, order) => {
        const price = parseFloat(order.orderPrice || "0");
        return acc + (isNaN(price) ? 0 : price);
      }, 0);

      // 🔹 LAST MONTH COUNTS
      const lastMonthTotal = lastMonthOrders.length;
      const lastMonthPending = lastMonthOrders.filter(
        (o) => o.status === "pending"
      ).length;
      const lastMonthCompleted = lastMonthOrders.filter(
        (o) => o.status === "completed"
      ).length;
      const lastMonthAmount = lastMonthOrders.reduce((acc, order) => {
        const price = parseFloat(order.orderPrice || "0");
        return acc + (isNaN(price) ? 0 : price);
      }, 0);
      const lastMonthCancelled = lastMonthOrders.filter(
        (o) => o.status === "cancelled"
      ).length;
      // 🔹 CURRENT MONTH COUNTS (for % comparison)
      const currentMonthTotal = currentMonthOrders.length;
      const currentMonthPending = currentMonthOrders.filter(
        (o) => o.status === "pending"
      ).length;
      const currentMonthCompleted = currentMonthOrders.filter(
        (o) => o.status === "completed"
      ).length;
      const currentMonthAmount = currentMonthOrders.reduce((acc, order) => {
        const price = parseFloat(order.orderPrice || "0");
        return acc + (isNaN(price) ? 0 : price);
      }, 0);
      const currentMonthCancelled = currentMonthOrders.filter(
        (o) => o.status === "cancelled"
      ).length;
      return {
        totalOrders: {
          value: totalOrders,
          changeFromLastMonth: getPercentageChange(
            currentMonthTotal,
            lastMonthTotal
          ),
        },
        pendingOrders: {
          value: pendingOrders,
          changeFromLastMonth: getPercentageChange(
            currentMonthPending,
            lastMonthPending
          ),
        },
        completedOrders: {
          value: completedOrders,
          changeFromLastMonth: getPercentageChange(
            currentMonthCompleted,
            lastMonthCompleted
          ),
        },
        cancelledOrders: {
          value: cancelledOrders,
          changeFromLastMonth: getPercentageChange(
            currentMonthCancelled,
            lastMonthCancelled
          ),
        },
        totalAmount: {
          value: `₹${totalAmount.toLocaleString("en-IN")}`,
          changeFromLastMonth: getPercentageChange(
            currentMonthAmount,
            lastMonthAmount
          ),
        },
      };
    } catch (error) {
      logger.error("Error calculating sales order stats:", error);
      throw error;
    }
  }

  async getOrdersListWithProductionManager({ status, agent, type }) {
    try {
      const query = {};
      if (status) query.status = status;
      if (agent) query.agent = agent;
      if (type) query["bagDetails.type"] = type; // Ensure type matches

      // Fetch orders and apply descending order by createdAt
      const orders = await SalesOrder.find(query).sort({ createdAt: -1 });

      // Extract orderIds from fetched orders
      const orderIds = orders.map((order) => order.orderId); // Assuming _id is the order ID

      // Fetch production managers related to the orders
      const productionManagers = await ProductionManager.find({
        order_id: { $in: orderIds },
      });
      // Map orders and attach the matching production manager
      const ordersWithManagers = orders.map((order) => {
        const productionManager = productionManagers.find(
          (pm) => pm.order_id.toString() === order.orderId.toString()
        );
        return {
          ...order.toObject(), // Convert Mongoose document to plain object
          productionManager: productionManager || null, // Attach the production manager or set as null if not found
        };
      });
      return {
        data: ordersWithManagers,
      };
    } catch (error) {
      logger.error("Error fetching sales orders:", error);
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const order = await SalesOrder.findOne({ orderId: orderId });
      console.log("list our --------", order);
      if (!order) {
        throw new Error("Order not found");
      }
      return order;
    } catch (error) {
      logger.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  async updateOrder(orderId, updateData) {
    try {
      const order = await SalesOrder.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!order) {
        throw new Error("Order not found");
      }
      // 3️⃣ Send Sales Overview Email
      try {
        await emailHelper.sendSalesOverviewEmail(order);
        console.log("✅ Sales Overview Email Sent Successfully");
      } catch (emailError) {
        console.error("⚠️ Failed to send sales overview email:", emailError);
      }

      return order;
    } catch (error) {
      logger.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
  }

  async deleteOrder(orderId) {
    try {
      // Find and delete the order by its ID
      const order = await SalesOrder.findByIdAndDelete(orderId);

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    } catch (error) {
      logger.error(`Error deleting order ${orderId}:`, error);
      throw error;
    }
  }
  async findOrdersByMobileNumber(mobileNumber) {
    try {
      const orders = await SalesOrder.find({
        mobileNumber: mobileNumber,
      }).select("customerName email address mobileNumber");
      return orders;
    } catch (error) {
      logger.error(
        `Error fetching orders by mobile number: ${mobileNumber}`,
        error
      );
      throw new Error("Error fetching orders");
    }
  }
  async findAllMobileNumbers() {
    try {
      const mobileNumbers = await SalesOrder.distinct("mobileNumber");
      return mobileNumbers;
    } catch (error) {
      logger.error("Error fetching mobile numbers:", error);
      throw new Error("Error fetching mobile numbers");
    }
  }
}

module.exports = new SalesOrderService();
