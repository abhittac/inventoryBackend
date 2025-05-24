const Delivery = require('../../models/Delivery');
const logger = require('../../utils/logger');

class DeliveryCommandService {
  async create(deliveryData) {
    try {
      const delivery = new Delivery({
        ...deliveryData,
        bagDetails: {
          type: deliveryData.bagType,
          handleColor: deliveryData.handleColor,
          size: deliveryData.size,
          color: deliveryData.bagColor,
          printColor: deliveryData.printColor,
          gsm: deliveryData.gsm
        }
      });

      return await delivery.save();
    } catch (error) {
      logger.error('Error creating delivery:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      return await Delivery.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { new: true }
      );
    } catch (error) {
      logger.error(`Error updating delivery ${id}:`, error);
      throw error;
    }
  }

  async softDelete(id) {
    try {
      return await Delivery.findOneAndUpdate(
        { _id: id },
        { $set: { isDeleted: true } },
        { new: true }
      );
    } catch (error) {
      logger.error(`Error soft deleting delivery ${id}:`, error);
      throw error;
    }
  }
}

module.exports = new DeliveryCommandService();