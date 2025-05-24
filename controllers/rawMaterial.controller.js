const RawMaterial = require('../models/RawMaterial');
const logger = require('../utils/logger');

class RawMaterialController {
  async create(req, res) {
    try {
      const rawMaterial = new RawMaterial(req.body);
      await rawMaterial.save();
      
      res.status(201).json({
        success: true,
        data: rawMaterial
      });
    } catch (error) {
      logger.error('Error creating raw material:', error);
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

      const [materials, total] = await Promise.all([
        RawMaterial.find().skip(skip).limit(limit),
        RawMaterial.countDocuments()
      ]);

      res.json({
        success: true,
        data: materials,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      });
    } catch (error) {
      logger.error('Error listing raw materials:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const material = await RawMaterial.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Raw material not found'
        });
      }

      res.json({
        success: true,
        data: material
      });
    } catch (error) {
      logger.error('Error updating raw material:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new RawMaterialController();