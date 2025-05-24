const Package = require('../../models/Package');
const logger = require('../../utils/logger');

class PackageController {
  async create(req, res) {
    try {
      const pkg = new Package(req.body);
      await pkg.save();

      res.status(201).json({
        success: true,
        data: pkg
      });
    } catch (error) {
      logger.error('Error creating package:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getByOrderId(req, res) {
    try {
      const packages = await Package.find({ order_id: req.params.orderId });

      res.json({
        success: true,
        data: packages
      });
    } catch (error) {
      logger.error('Error getting packages by order ID:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { orderId, packageIndex } = req.params;
      const updateData = req.body;

      // Find the package document by order ID
      const pkg = await Package.findOne({ order_id: orderId });

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found for this order'
        });
      }

      // Check if the package index exists
      if (!pkg.package_details[packageIndex]) {
        return res.status(404).json({
          success: false,
          message: 'Package index not found'
        });
      }

      // Update the specific package details
      pkg.package_details[packageIndex] = {
        ...pkg.package_details[packageIndex].toObject(),
        ...updateData
      };

      // Save the updated document
      await pkg.save();

      res.json({
        success: true,
        data: pkg
      });
    } catch (error) {
      logger.error('Error updating package:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PackageController();