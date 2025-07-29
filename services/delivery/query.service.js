const Delivery = require("../../models/Delivery");
const SalesOrder = require("../../models/SalesOrder"); // Assuming this is your salesorders model
const logger = require("../../utils/logger");

class DeliveryQueryService {
  async findById(id) {
    try {
      // Fetch the delivery details
      const delivery = await Delivery.findById(id);
      if (!delivery) {
        throw new Error("Delivery not found");
      }

      // Fetch the related sales order using orderId
      const salesOrder = await SalesOrder.findOne({
        orderId: delivery.orderId,
      });
      if (!salesOrder) {
        throw new Error("Sales order not found");
      }

      // Prepare the response including delivery and customer details
      return {
        success: true,
        data: delivery, // Return the Mongoose model instance
        customer: salesOrder.customerName,
        contact: salesOrder.mobileNumber,
      };
    } catch (error) {
      logger.error("Error fetching delivery by ID:", error);
      throw error;
    }
  }

  async findByOrderId(orderId) {
    try {
      const delivery = await Delivery.findOne({ orderId }); // Populate if needed
      return delivery;
    } catch (error) {
      logger.error("Error fetching delivery by Order ID:", error);
      throw error;
    }
  }

  async list({
    status,
    dateRange,
    customerName,
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    try {
      const query = {};

      // Fix status filter
      if (status) {
        query.status = status;
      }

      if (customerName) {
        query.customerName = new RegExp(customerName, "i"); // Case-insensitive search
      }

      if (dateRange) {
        query.createdAt = dateRange;
      }

      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Fetch all deliveries (no pagination)
      const deliveries = await Delivery.find(query).sort(sort);

      // Fetch order details from SalesOrder table
      const enrichedDeliveries = await Promise.all(
        deliveries.map(async (delivery) => {
          const orderDetails = await SalesOrder.findOne({
            orderId: delivery.orderId,
          });
          return {
            ...delivery.toObject(),
            orderDetails: orderDetails ? orderDetails.toObject() : null,
          };
        })
      );

      return { data: enrichedDeliveries };
    } catch (error) {
      logger.error("Error querying deliveries:", error);
      throw error;
    }
  }

  // Delete a sale order by ID
  async deleteDelivery(id) {
    try {
      const result = await Delivery.findByIdAndDelete(id);
      return result ? true : false;
    } catch (error) {
      logger.error("Error deleting order:", error);
      throw error;
    }
  }
}

module.exports = new DeliveryQueryService();
