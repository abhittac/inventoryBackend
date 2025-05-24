
const Delivery = require('../../models/Delivery');
const Invoice = require('../../models/Invoice');
const Package = require('../../models/Package');
const ProductionManager = require('../../models/ProductionManager');
const SalesOrder = require('../../models/SalesOrder');
const logger = require('../../utils/logger');
const emailHelper = require("../helpers/emailHelper");

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
  async sendInvoiceEmail(req, res) {
    const { invoice } = req.body;

    if (!invoice) {
      return res.status(400).json({ message: 'invoice Id are required' });
    }

    try {
      const result = await emailHelper.sendInvoiceEmail(invoice);

      if (result.success) {
        return res.status(200).json({ message: result.message });
      } else {
        return res.status(500).json({ message: result.message, error: result.error });
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      return res.status(500).json({ message: 'Failed to send invoice', error: error.message });
    }
  }

  async list(req, res) {
    try {
      console.log('Fetching finished products...');

      // Fetch all finished products
      const products = await Invoice.find().sort({ _id: -1 });
      console.log(`Found ${products.length} finished products.`, products);

      if (products.length === 0) {
        console.log('No finished products found.');
        return res.status(404).json({
          success: false,
          message: 'No finished products found.'
        });
      }

      // Fetch order details from SalesOrder using the orderId
      const orderIds = products
        .map(product => product.order_id)  // Extract order_id (ensure consistency in naming)
        .filter(order_id => order_id !== undefined && order_id !== null);  // Only keep valid orderIds

      console.log('------orderIds-------', orderIds);
      if (orderIds.length === 0) {
        console.log('No valid orderIds found.');
        return res.status(404).json({
          success: false,
          message: 'No valid orderIds found.'
        });
      }

      console.log(`Fetching sales orders for ${orderIds.length} orders...`);
      const orders = await SalesOrder.find({ orderId: { $in: orderIds } });
      console.log(`Found ${orders.length} sales orders.`, orders);

      // If no orders are found, return early
      if (orders.length === 0) {
        console.log('No matching sales orders found.');
        return res.status(404).json({
          success: false,
          message: 'No matching sales orders found.'
        });
      }

      // Fetch production manager details for each order
      const productionManagerIds = orders.map(order => order.orderId); // Using orderId to match in production manager
      console.log(`Fetching production manager details for ${productionManagerIds.length} orders...`);
      const productionManagers = await ProductionManager.find({ order_id: { $in: productionManagerIds } });
      console.log(`Found ${productionManagers.length} production managers.`, productionManagers);

      // Fetch package details for each finished product
      const packageIds = products.map(product => product.orderId); // Assuming FinishedProduct has 'orderId'
      console.log(`Fetching package details for ${packageIds.length} products...`);
      const packages = await Package.find({ orderId: { $in: packageIds } });
      console.log(`Found ${packages.length} packages.`, packages);

      // Fetch delivery details based on orderId
      console.log('Fetching delivery details...');
      const deliveries = await Delivery.find({ orderId: { $in: orderIds } });
      console.log(`Found ${deliveries.length} delivery records.`, deliveries);

      // Combine all data
      // Mapping the data correctly to ensure details are populated
      const productsWithDetails = products.map(product => {
        // Find corresponding order, production manager, package, and delivery data
        const order = orders.find(order => order.orderId === product.order_id);
        // Check the product object
        console.log('Product:', product);

        // Check for correct order_id in product
        console.log('Product order_id:', product?.order_id);

        // Check the productionManager list and order_id for each entry
        console.log('Production Managers:', productionManagers);
        console.log('Production Manager order_id:', productionManagers.map(manager => manager.order_id));

        // Try to find the matching production manager
        const productionManager = productionManagers.find(manager => manager.order_id === product?.order_id);
        console.log('Found production manager:', productionManager);

        const packageData = packages.find(pkg => pkg.order_id === product.order_id);
        const delivery = deliveries.find(del => del.orderId === product.order_id);

        return {
          ...product.toObject(),  // Convert product mongoose object to plain object
          orderDetails: order || {},  // Use order or empty object if not found
          productionManagerDetails: productionManager || {},
          packageDetails: packageData || {},
          deliveryDetails: delivery || {}
        };
      });


      // Return the combined data
      res.json({
        success: true,
        data: productsWithDetails
      });
    } catch (error) {
      // Log the error for debugging and send a 500 error response
      logger.error('Error listing finished products:', error);
      console.error('Error details:', error);  // Log the full error for debugging
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new InvoiceController();