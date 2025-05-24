const Sale = require('../models/SalesOrder');
const logger = require('../utils/logger');

class SaleService {
  async getSales({ search, status }) {
    try {
      const query = {};
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
          { orderId: regex },          // Search by Order ID
          { customerName: regex },     // Search by Customer Name
          { email: regex },            // Search by Email
          { mobileNumber: regex },     // Search by Mobile Number
          { address: regex },          // Search by Address
          { jobName: regex },          // Search by Job Name
          { agent: regex },            // Search by Agent
        ];
      }

      if (status && status !== 'all') {
        query.status = status;
      }
      const sales = await Sale.find(query).sort({ _id: -1 });
      return {
        data: sales,
      };
    } catch (error) {
      logger.error('Error fetching sales:', error);
      throw error;
    }
  }

  // Fetch a single order by ID
  async getOrderById(id) {
    try {
      return await Sale.findById(id);
    } catch (error) {
      logger.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  // Update a sale order by ID
  async updateOrder(id, updatedData) {
    try {
      return await Sale.findByIdAndUpdate(id, updatedData, { new: true });
    } catch (error) {
      logger.error('Error updating order:', error);
      throw error;
    }
  }

  // Delete a sale order by ID
  async deleteOrder(id) {
    try {
      const result = await Sale.findByIdAndDelete(id);
      return result ? true : false;
    } catch (error) {
      logger.error('Error deleting order:', error);
      throw error;
    }
  }
}

module.exports = new SaleService();