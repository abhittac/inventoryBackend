const DeliveryQueryService = require('../../services/delivery/query.service');
const logger = require('../../utils/logger');

class DeliveryQueryController {
  async getById(req, res) {
    try {
      const { id } = req.params;
      const delivery = await DeliveryQueryService.findById(id);
      console.log('fsdfsdfs');

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found'
        });
      }

      res.json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Error fetching delivery by ID:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getByOrderId(req, res) {
    try {
      const { orderId } = req.params;
      const delivery = await DeliveryQueryService.findByOrderId(orderId);
      console.log('dsadadadada');

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found'
        });
      }

      res.json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Error fetching delivery:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async list(req, res) {
    try {
      const { status, timeRange, customerName, sortBy, sortOrder } = req.query;

      // Build Query Object
      let query = {};

      // Handle status filter correctly
      if (status && status !== "all") {
        query.status = status; // Only filter if status is not 'all'
      }

      // Handle timeRange filter
      if (timeRange) {
        const now = new Date();
        let startDate, endDate;

        switch (timeRange.toLowerCase()) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0)); // Start of today
            endDate = new Date(now.setHours(23, 59, 59, 999)); // End of today
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
            endDate = new Date(); // Now
            break;
          case "week":
            startDate = new Date();
            startDate.setDate(now.getDate() - 7); // Last 7 days
            endDate = new Date(); // Now
            break;
          default:
            startDate = null;
        }

        if (startDate && endDate) {
          query.createdAt = { $gte: startDate, $lte: endDate };
        }
      }

      const result = await DeliveryQueryService.list({
        status: query.status,
        dateRange: query.createdAt,
        customerName,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error("Error listing deliveries:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

}

module.exports = new DeliveryQueryController();