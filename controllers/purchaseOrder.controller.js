const PurchaseOrder = require('../models/PurchaseOrder');
const logger = require('../utils/logger');

class PurchaseOrderController {
  async create(req, res) {
    try {
      const order = new PurchaseOrder(req.body);
      await order.save();
      
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Error creating purchase order:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async list(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        PurchaseOrder.find().skip(skip).limit(limit),
        PurchaseOrder.countDocuments()
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      });
    } catch (error) {
      logger.error('Error listing purchase orders:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PurchaseOrderController();