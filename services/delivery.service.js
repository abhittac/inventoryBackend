const Delivery = require('../models/Delivery');
const logger = require('../utils/logger');

class DeliveryService {
  async getDeliveries({ delivery_status, date, page = 1, limit = 10 }) {
    try {
      const query = {};
      if (delivery_status) query.deliveryStatus = delivery_status;
      if (date) query.deliveryDate = new Date(date);

      const skip = (page - 1) * limit;

      const [deliveries, total] = await Promise.all([
        Delivery.find(query).skip(skip).limit(limit),
        Delivery.countDocuments(query)
      ]);

      return {
        data: deliveries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      };
    } catch (error) {
      logger.error('Error fetching deliveries:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    console.log('updateData', updateData);

    try {
      // Find and update the delivery document
      const delivery = await Delivery.findOneAndUpdate(
        { _id: id }, // Find the document by ID
        {
          $set: updateData, // Set the updated fields
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create the document if it doesn't exist
        }
      );

      return delivery; // Return the updated delivery document
    } catch (error) {
      logger.error(`Error updating delivery ${id}:`, error);
      throw error; // Re-throw error if needed
    }
  }

}

module.exports = new DeliveryService();