
const Delivery = require('../../models/Delivery');
const Invoice = require('../../models/Invoice');
const Package = require('../../models/Package');
const ProductionManager = require('../../models/ProductionManager');
const SalesOrder = require('../../models/SalesOrder');
const logger = require('../../utils/logger');
const emailHelper = require("../helpers/emailHelper");
const DcutBagmaking = require('../../models/DcutBagmaking');
const WcutBagmaking = require('../../models/WcutBagmaking');
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
      const products = await Invoice.find().sort({ _id: -1 });
      if (products.length === 0) {
        return res.status(404).json({ success: false, message: 'No finished products found.' });
      }

      const orderIds = products.map(p => p.order_id).filter(Boolean);
      if (orderIds.length === 0) {
        return res.status(404).json({ success: false, message: 'No valid orderIds found.' });
      }

      const [orders, productionManagers, packages, deliveries, wcutScraps, dcutScraps] = await Promise.all([
        SalesOrder.find({ orderId: { $in: orderIds } }),
        ProductionManager.find({ order_id: { $in: orderIds } }),
        Package.find({ orderId: { $in: orderIds } }),
        Delivery.find({ orderId: { $in: orderIds } }),
        WcutBagmaking.find({ order_id: { $in: orderIds } }),
        DcutBagmaking.find({ order_id: { $in: orderIds } }),
      ]);

      const productsWithDetails = products.map(product => {
        const order = orders.find(o => o.orderId === product.order_id) || {};
        const productionManager = productionManagers.find(pm => pm.order_id === product.order_id) || {};
        const packageData = packages.find(pkg => pkg.orderId === product.order_id) || {};
        const delivery = deliveries.find(del => del.orderId === product.order_id) || {};
        const wcutScrap = wcutScraps.find(w => w.order_id === product.order_id);
        const dcutScrap = dcutScraps.find(d => d.order_id === product.order_id);

        return {
          ...product.toObject(),
          orderDetails: order,
          productionManagerDetails: productionManager,
          packageDetails: packageData,
          deliveryDetails: delivery,
          scrapDetails: {
            wcutScrapQty: wcutScrap?.scrapQuantity || 0,
            dcutScrapQty: dcutScrap?.scrapQuantity || 0
          }
        };
      });

      res.json({ success: true, data: productsWithDetails });

    } catch (error) {
      console.error('Error listing finished products:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new InvoiceController();