const ProductionManager = require('../../models/ProductionManager');
const logger = require('../../utils/logger');
const SalesOrderService = require('../../services/salesOrder.service');
const SalesOrder = require('../../models/SalesOrder');
const DcutBagmaking = require('../../models/DcutBagmaking');
const Flexo = require('../../models/Flexo');
const Subcategory = require('../../models/subcategory');
class ProductionManagerController {
  // W-Cut Bagmaking Methods
  async listWCutBagmaking(req, res) {
    try {
      const { status, agent, page, limit } = req.query;
      const type = "w_cut_box_bag"; // Ensure type matches
      const orders = await SalesOrderService.getOrdersListWithProductionManager({ status, agent, type });

      console.log('order data list is ', orders);
      res.json({
        success: true,
        data: orders.data
      });
    } catch (error) {
      logger.error('Error in get orders controller:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateData(req, res) {
    console.log('Request data:', req.body);
    try {
      const { order_id } = req.params;
      const { type, roll_size, quantity_kgs, quantity_rolls } = req.body;

      let entry = await ProductionManager.findOne({ order_id });

      // Prevent updates if status is 'in_progress'
      if (entry && entry.status === 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update. The entry is in progress.',
        });
      }
      // Prepare update data
      const updateData = {
        production_details: {
          ...req.body,
          remaining_quantity: Number(req.body.quantity_kgs) || 0,
        },
        updatedAt: new Date(),
      };

      console.log('updateData', updateData)
      // Fetch the related sales order
      const salesRecord = await SalesOrder.findOne({ orderId: order_id });
      if (!salesRecord) {
        return res.status(404).json({ success: false, message: "Sales record not found" });
      }

      const { fabricQuality } = salesRecord;
      const { color: fabricColor, gsm } = salesRecord.bagDetails;


      console.log("-----------------------------------------------");
      console.log("Matched Subcategory - fabricQuality:", fabricQuality);
      console.log("Matched Subcategory - Fabric Color:", fabricColor);
      console.log("Matched Subcategory - Fabric gsm:", gsm);
      console.log("Matched Subcategory - rollSize:", roll_size);
      // Fetch matching subcategories (active raw materials)
      let subcategoryMatches = await Subcategory.find({
        fabricColor,
        rollSize: parseInt(roll_size),
        gsm,
        fabricQuality,
        status: 'active',
      });

      // if (!subcategoryMatches.length) {
      //   return res.status(404).json({ success: false, message: "No raw material available for this order." });
      // }

      console.log('Matching subcategories:', subcategoryMatches);

      // Sort subcategory matches in descending order (to use largest rolls first)
      subcategoryMatches.sort((a, b) => b.quantity - a.quantity);

      // Select required rolls dynamically until quantity_kgs and quantity_rolls are met
      let selectedMaterials = [];
      let totalSelectedKg = 0;
      let totalRollsSelected = 0;

      for (const roll of subcategoryMatches) {
        if (totalRollsSelected < quantity_rolls && totalSelectedKg < quantity_kgs) {
          selectedMaterials.push(roll);
          totalSelectedKg += roll.quantity;
          totalRollsSelected++;
        }
        if (totalRollsSelected >= quantity_rolls || totalSelectedKg >= quantity_kgs) break;
      }

      console.log(' totalRollsSelected:', totalRollsSelected);
      console.log(' quantity_rolls:', quantity_rolls);
      // If not enough rolls are available
      if (totalRollsSelected < quantity_rolls) {
        return res.status(400).json({
          success: false,
          message: `Insufficient rolls available. You requested ${quantity_rolls} rolls, but only ${totalRollsSelected} were found. Please adjust your order or check available stock.`,
        });
      }

      // If selected rolls do not meet required quantity
      if (totalSelectedKg < quantity_kgs) {
        return res.status(400).json({
          success: false,
          message: `Insufficient material weight. You need ${quantity_kgs} kg, but only ${totalSelectedKg} kg is available. Consider selecting different sizes or reducing the required weight.`,
        });
      }
      const subcategoryIds = selectedMaterials.map(item => item._id);
      console.log('subcategoryIds', subcategoryIds);
      // Update or create ProductionManager entry
      if (entry) {
        entry = await ProductionManager.findOneAndUpdate(
          { order_id },
          { $set: updateData },
          { new: true, runValidators: true }
        );
      } else {
        entry = new ProductionManager({
          order_id,
          production_details: updateData.production_details,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await entry.save();
      }

      // Insert into Flexo or DcutBagmaking if needed
      if (type === 'WCut') {
        const flexoExists = await Flexo.findOne({ order_id });
        if (!flexoExists) {
          await new Flexo({
            order_id,
            status: 'pending',
            details: req.body,
            subcategoryIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).save();
        }
      } else if (type === 'DCut') {
        const dcutExists = await DcutBagmaking.findOne({ order_id });
        if (!dcutExists) {
          await new DcutBagmaking({
            order_id,
            status: 'pending',
            details: req.body,
            subcategoryIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).save();
        }
      }

      res.status(200).json({
        success: true,
        data: entry,
      });

    } catch (error) {
      console.error('Error updating or creating entry:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }



  async listDCutBagmaking(req, res) {
    try {
      const { status, agent } = req.query;
      const type = "d_cut_loop_handle"; // Ensure type matches
      const orders = await SalesOrderService.getOrdersListWithProductionManager({ status, agent, type });
      res.json({
        success: true,
        data: orders.data
      });
    } catch (error) {
      logger.error('Error in get orders controller:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }


  async viewOrderDetails(req, res) {
    try {
      const { order_id } = req.params;
      console.log(order_id);
      // Fetch the order details
      const order = await SalesOrderService.getOrderById(order_id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      const productionManager = await ProductionManager.findOne({ order_id });
      const result = {
        order: order,
        production_manager: productionManager
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching order and production manager details:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getData(req, res) {
    try {
      const { order_id } = req.params;
      const productionManager = await ProductionManager.findOne({ order_id });
      res.json({
        success: true,
        data: {
          production_manager: productionManager
        }
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

}

module.exports = new ProductionManagerController();