const SaleService = require('../../services/sale.service');
const logger = require('../../utils/logger');

class SalesController {
  async getSales(req, res) {
    try {
      const { search, status, type } = req.query;

      // Pass the search query parameters to the service
      const sales = await SaleService.getSales({
        search,
        status: status !== 'all' ? status : null,
        type: type !== 'all' ? type : null,
      });

      res.json({
        success: true,
        data: sales.data,  // Return sales data without pagination
      });
    } catch (error) {
      logger.error('Error fetching sales:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }




  // Fetch a single sale order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await SaleService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error fetching order by ID:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update a sale order by ID
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const updatedData = req.body;

      const updatedOrder = await SaleService.updateOrder(id, updatedData);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order updated successfully',
      });
    } catch (error) {
      logger.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete a sale order by ID
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      const deleted = await SaleService.deleteOrder(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      res.json({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
module.exports = new SalesController();
