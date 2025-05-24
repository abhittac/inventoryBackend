const Flexo = require('../models/Flexo');
const logger = require('../utils/logger');

class FlexoController {
  async list(req, res) {
    try {
      const { status, jobName, bagType, page = 1, limit = 10 } = req.query;
      const query = {};

      // Apply filters if provided
      if (status) query.status = status;
      if (jobName) query.jobName = new RegExp(jobName, 'i');
      if (bagType) query.bagType = bagType;

      const skip = (page - 1) * limit;

      const [entries, total] = await Promise.all([
        Flexo.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Flexo.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: entries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNextPage: skip + entries.length < total,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      logger.error('Error listing flexo entries:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      // Validate status transition
      if (updateData.status) {
        const currentEntry = await Flexo.findById(id);
        if (!currentEntry) {
          return res.status(404).json({
            success: false,
            message: 'Flexo entry not found'
          });
        }

        // Validate status transition
        const validTransitions = {
          pending: ['in_progress'],
          in_progress: ['completed'],
          completed: []
        };

        if (!validTransitions[currentEntry.status]?.includes(updateData.status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status transition from ${currentEntry.status} to ${updateData.status}`
          });
        }
      }

      const updatedEntry = await Flexo.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          message: 'Flexo entry not found'
        });
      }

      res.json({
        success: true,
        data: updatedEntry
      });
    } catch (error) {
      logger.error('Error updating flexo entry:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getReport(req, res) {
    try {
      const { time_range, start_date, end_date, status } = req.query;
      const query = {};

      // Handle time range filtering
      const now = new Date();
      let startDate, endDate;

      switch (time_range) {
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          endDate = new Date(now);
          endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          if (!start_date || !end_date) {
            return res.status(400).json({
              success: false,
              message: 'start_date and end_date are required for custom time range'
            });
          }
          startDate = new Date(start_date);
          endDate = new Date(end_date);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          break;
        default:
          // If no time_range specified, default to all-time
          break;
      }

      if (startDate && endDate) {
        query.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }

      // Add status filter if provided
      if (status) {
        query.status = status;
      }

      // Get entries and calculate statistics
      const entries = await Flexo.find(query).sort({ createdAt: -1 });

      // Calculate statistics
      const statistics = {
        total: entries.length,
        byStatus: {
          pending: entries.filter(e => e.status === 'pending').length,
          in_progress: entries.filter(e => e.status === 'in_progress').length,
          completed: entries.filter(e => e.status === 'completed').length
        },
        totalQuantity: entries.reduce((sum, entry) => sum + entry.quantity, 0)
      };

      res.json({
        success: true,
        data: {
          entries,
          statistics,
          timeRange: {
            start: startDate || 'all-time',
            end: endDate || 'all-time'
          }
        }
      });
    } catch (error) {
      logger.error('Error generating flexo report:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new FlexoController();