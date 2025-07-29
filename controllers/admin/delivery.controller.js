const Delivery = require("../../models/Delivery");
const DeliveryQueryService = require("../../services/delivery/query.service");
const logger = require("../../utils/logger");

class DeliveryController {
  async getDeliveries(req, res) {
    try {
      const { delivery_status, date, page, limit } = req.query;

      const deliveries = await DeliveryQueryService.list({
        status: delivery_status,
        dateRange: date ? `${date},${date}` : undefined,
        page,
        limit,
      });

      res.json({
        success: true,
        data: deliveries.data,
        pagination: deliveries.pagination,
      });
    } catch (error) {
      logger.error("Error fetching deliveries:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async getById(req, res) {
    try {
      const { id } = req.params;
      const delivery = await DeliveryQueryService.findById(id);

      res.json({
        success: true,
        data: delivery,
      });
    } catch (error) {
      logger.error("Error fetching delivery by ID:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updatedData = req.body;

      const { data: delivery } = await DeliveryQueryService.findById(id);
      Object.assign(delivery, updatedData);

      await delivery.save();

      res.json({
        success: true,
        message: "Delivery updated successfully",
        data: delivery,
      });
    } catch (error) {
      logger.error("Error updating delivery:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Find the delivery by ID
      const delivery = await DeliveryQueryService.findById(id);

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: "Delivery not found",
        });
      }
      await DeliveryQueryService.deleteDelivery({ _id: id });
      res.json({
        success: true,
        message: "Delivery deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting delivery:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new DeliveryController();
