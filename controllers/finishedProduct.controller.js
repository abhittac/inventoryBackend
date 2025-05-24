const FinishedProduct = require('../models/FinishedProduct');
const logger = require('../utils/logger');

class FinishedProductController {
  async create(req, res) {
    try {
      const product = new FinishedProduct(req.body);
      await product.save();

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Error creating finished product:', error);
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

      const [products, total] = await Promise.all([
        FinishedProduct.find().skip(skip).limit(limit),
        FinishedProduct.countDocuments()
      ]);

      res.json({
        success: true,
        data: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      });
    } catch (error) {
      logger.error('Error listing finished products:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new FinishedProductController();