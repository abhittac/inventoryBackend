const DcutBagmaking = require('../../models/DcutBagmaking');
const Delivery = require('../../models/Delivery');
const FinishedProduct = require('../../models/FinishedProduct');
const Flexo = require('../../models/Flexo');
const Opsert = require('../../models/Opsert');
const Package = require('../../models/Package');
const ProductionManager = require('../../models/ProductionManager');
const SalesOrder = require('../../models/SalesOrder');
const Subcategory = require('../../models/subcategory');
const WcutBagmaking = require('../../models/WcutBagmaking');
const logger = require('../../utils/logger');

const { updateFinishedProductSchema } = require('../../validators/product.validator');
class FinishedProductController {
  async create(req, res) {
    try {
      const product = new FinishedProduct(req.body);
      await product.save();

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Error creating finished product:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  async update(req, res) {
    try {
      // console.log(updateFinishedProductSchema);  // Log the imported schema to verify it's not undefined
      // const { error, value } = updateFinishedProductSchema.validate(req.body);

      // if (error) {
      //   return res.status(400).json({
      //     success: false,
      //     message: error.details[0].message
      //   });
      // }

      // Find the product by ID and update it
      const product = await FinishedProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      logger.error('Error updating finished product:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getFullDetail(req, res) {
    try {
      const productId = req.params.id; // Get productId from URL params
      console.log(`Fetching details for product: ${productId}`);

      // Fetch the specific finished product by productId
      const product = await FinishedProduct.findById(productId);
      if (!product) {
        console.log('Finished product not found.');
        return res.status(404).json({
          success: false,
          message: 'Finished product not found.'
        });
      }

      console.log(`Found finished product:`, product);

      // Fetch the corresponding order details based on the product's order_id
      const order = await SalesOrder.findOne({ orderId: product.order_id });
      if (!order) {
        console.log('No matching sales order found.');
        return res.status(404).json({
          success: false,
          message: 'No matching sales order found.'
        });
      }

      console.log('Found order:', order);

      // Fetch production manager details for the given order
      const productionManager = await ProductionManager.findOne({ order_id: product.order_id });
      console.log('Found production manager:', productionManager);

      // Fetch package details based on the product's order_id
      const packageData = await Package.findOne({ order_id: product.order_id });
      console.log('Found package details:', packageData);

      // Fetch delivery details for the given order_id
      const delivery = await Delivery.findOne({ orderId: product.order_id });
      console.log('Found delivery details:', delivery);


      let productionDetails = null;

      // Fetch unit numbers based on bag type
      let flexoUnitNumber = "N/A";
      let wcutUnitNumber = "N/A";
      let dcutUnitNumber = "N/A";
      let opsertUnitNumber = "N/A";

      let flexDate = "N/A";
      let wcutDate = "N/A";
      let dcutDate = "N/A";
      let opsertDate = "N/A";

      if (productionManager?.production_details?.type === 'WCut') {
        productionDetails = await Flexo.findOne({ order_id: product.order_id }).populate({
          path: 'subcategoryIds',
          model: 'Subcategory',
        });

        const wcutData = await WcutBagmaking.findOne({ order_id: product.order_id });

        flexoUnitNumber = productionDetails?.unit_number || "N/A";
        wcutUnitNumber = wcutData?.unit_number || "N/A";
        flexDate = productionDetails?.updatedAt || "N/A";
        wcutDate = wcutData?.updatedAt || "N/A";

        if (productionDetails && wcutData?.scrapQuantity) {
          productionDetails.scrapQuantity = wcutData.scrapQuantity;
        }

      } else if (productionManager?.production_details?.type === 'DCut') {

        productionDetails = await DcutBagmaking.findOne({ order_id: product.order_id }).populate({
          path: 'subcategoryIds',
          model: 'Subcategory',
        });

        const dcutData = await DcutBagmaking.findOne({ order_id: product.order_id });
        const opsertData = await Opsert.findOne({ order_id: product.order_id });

        dcutUnitNumber = dcutData?.unit_number || "N/A";
        opsertUnitNumber = opsertData?.unit_number || "N/A";

        dcutDate = dcutData?.updatedAt || "N/A";
        opsertDate = opsertData?.updatedAt || "N/A";

        if (productionDetails && opsertData?.scrapQuantity) {
          productionDetails.scrapQuantity = opsertData.scrapQuantity;
        }
      }

      console.log("Production Details with Populated Subcategory:", productionDetails);


      // === ✅ Quantity Calculations ===
      let totalQuantity = 0;
      let scrapQuantity = 0;
      let remainingQuantity = 0;

      if (productionDetails?.subcategoryIds && Array.isArray(productionDetails.subcategoryIds)) {
        totalQuantity = productionDetails.subcategoryIds.reduce((sum, sub) => {
          return sum + Number(sub.quantity || 0);
        }, 0);
      }

      scrapQuantity = Number(productionDetails?.scrapQuantity || 0);
      remainingQuantity = totalQuantity - scrapQuantity;

      // Combine all data and return it in the response
      const productWithDetails = {
        ...product.toObject(),  // Convert the Mongoose product object to a plain JavaScript object
        orderDetails: order || {},  // Attach the order details, or an empty object if not found
        productionManagerDetails: productionManager || {},
        packageDetails: packageData || {},
        deliveryDetails: delivery || {},
        productionDetails: productionDetails || {},
        operatorCompleteDate: {
          flexo: flexDate,
          wcut: wcutDate,
          dcut: dcutDate,
          opsert: opsertDate,
        },
        unitNumbers: {
          flexo: flexoUnitNumber,
          wcut: wcutUnitNumber,
          dcut: dcutUnitNumber,
          opsert: opsertUnitNumber
        },
        totalQuantity,
        scrapQuantity,
        remainingQuantity
      };


      // Send the response with all combined details
      res.json({
        success: true,
        data: productWithDetails
      });

    } catch (error) {
      // Log the error and send a 500 error response
      logger.error('Error fetching full details for finished product:', error);
      console.error('Error details:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }




  async list(req, res) {
    try {
      console.log('Fetching finished products...');

      // Fetch all finished products
      const products = await FinishedProduct.find().sort({ createdAt: -1 });

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


  async delete(req, res) {
    try {
      console.log('req.params.id', req.params.id);
      // Find and delete the finished product by its ID
      const deletedProduct = await FinishedProduct.findByIdAndDelete(req.params.id);

      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: 'FinishedProduct not found'
        });
      }

      res.json({
        success: true,
        message: 'FinishedProduct deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting FinishedProduct:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


}

module.exports = new FinishedProductController();