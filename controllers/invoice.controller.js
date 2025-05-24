const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

class InvoiceController {
  async create(req, res) {
    try {
      const invoice = new Invoice(req.body);
      await invoice.save();

      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error creating invoice:', error);
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

      const [invoices, total] = await Promise.all([
        Invoice.find().skip(skip).limit(limit),
        Invoice.countDocuments()
      ]);

      res.json({
        success: true,
        data: invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      });
    } catch (error) {
      logger.error('Error listing invoices:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new InvoiceController();