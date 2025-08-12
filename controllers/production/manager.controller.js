const ProductionManager = require("../../models/ProductionManager");
const logger = require("../../utils/logger");
const SalesOrderService = require("../../services/salesOrder.service");
const SalesOrder = require("../../models/SalesOrder");
const DcutBagmaking = require("../../models/DcutBagmaking");
const Flexo = require("../../models/Flexo");
const Subcategory = require("../../models/subcategory");
class ProductionManagerController {
  // W-Cut Bagmaking Methods
  async listWCutBagmaking(req, res) {
    try {
      const { status, agent, page, limit } = req.query;
      const type = "w_cut_box_bag"; // Ensure type matches
      const orders = await SalesOrderService.getOrdersListWithProductionManager(
        { status, agent, type }
      );

      res.json({
        success: true,
        data: orders.data,
        check: "new",
      });
    } catch (error) {
      logger.error("Error in get orders controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateData(req, res) {
    console.log("Request data:", req.body);

    // return false;
    try {
      const { order_id } = req.params;
      const { type, roll_size, quantity_kgs, quantity_rolls } = req.body;

      let entry = await ProductionManager.findOne({ order_id });

      // Prevent updates if status is 'in_progress'
      if (entry && entry.status === "in_progress") {
        return res.status(400).json({
          success: false,
          message: "Cannot update. The entry is in progress.",
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

      console.log("updateData", updateData);
      // Fetch the related sales order
      const salesRecord = await SalesOrder.findOne({ orderId: order_id });
      if (!salesRecord) {
        return res
          .status(404)
          .json({ success: false, message: "Sales record not found" });
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
        status: "active",
        is_used: false,
      });

      // if (!subcategoryMatches.length) {
      //   return res.status(404).json({ success: false, message: "No raw material available for this order." });
      // }

      console.log("Matching subcategories:", subcategoryMatches);

      // Get all used subcategoryIds from Flexo and Dcut
      const usedInFlexo = await Flexo.find({
        subcategoryIds: { $in: subcategoryMatches.map((s) => s._id) },
      });
      const usedInDcut = await DcutBagmaking.find({
        subcategoryIds: { $in: subcategoryMatches.map((s) => s._id) },
      });

      const usedIds = new Set([
        ...usedInFlexo.flatMap((doc) => doc.subcategoryIds.map(String)),
        ...usedInDcut.flatMap((doc) => doc.subcategoryIds.map(String)),
      ]);

      // Filter out used ones
      subcategoryMatches = subcategoryMatches.filter(
        (s) => !usedIds.has(String(s._id))
      );

      // Sort subcategory matches in descending order (to use largest rolls first)

      subcategoryMatches.sort((a, b) => a.quantity - b.quantity);

      // Select required rolls dynamically until quantity_kgs and quantity_rolls are met
      // Select required rolls dynamically until quantity_kgs and quantity_rolls are met
      let selectedMaterials = [];
      let totalSelectedKg = 0;
      let totalRollsSelected = 0;

      for (const roll of subcategoryMatches) {
        if (
          totalRollsSelected < quantity_rolls &&
          totalSelectedKg < quantity_kgs
        ) {
          selectedMaterials.push(roll);
          totalSelectedKg += roll.quantity;
          totalRollsSelected++;
        }
        if (
          totalRollsSelected >= quantity_rolls ||
          totalSelectedKg >= quantity_kgs
        )
          break;
      }

      console.log(" totalRollsSelected:", totalRollsSelected);
      console.log(" quantity_rolls:", quantity_rolls);

      // If not enough weight, check how many rolls *would be needed* to meet the weight
      if (totalSelectedKg < quantity_kgs) {
        let requiredRollsToMeetWeight = 0;
        let weightTracker = 0;

        for (const roll of subcategoryMatches) {
          weightTracker += roll.quantity;
          requiredRollsToMeetWeight++;
          if (weightTracker >= quantity_kgs) break;
        }

        return res.status(400).json({
          success: false,
          message: `Insufficient material weight. You need ${quantity_kgs} kg, but only ${totalSelectedKg} kg is available with ${totalRollsSelected} rolls. You may need at least ${requiredRollsToMeetWeight} rolls to fulfill the weight requirement.`,
        });
      }

      // If not enough rolls
      if (totalRollsSelected < quantity_rolls) {
        return res.status(400).json({
          success: false,
          message: `Insufficient rolls available. You requested ${quantity_rolls} rolls, but only ${totalRollsSelected} were found. Please adjust your order or check available stock.`,
        });
      }

      const subcategoryIds = selectedMaterials.map((item) => item._id);

      console.log("subcategoryIds", subcategoryIds);

      if (subcategoryIds.length > 0) {
        console.log("-----Enter it-----");
        const result = await Subcategory.updateMany(
          { _id: { $in: subcategoryIds } },
          { $set: { is_used: true } }
        );
      }

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

      if (type === "WCut") {
        const existingFlexo = await Flexo.findOne({ order_id });

        if (!existingFlexo) {
          await new Flexo({
            order_id,
            status: "pending",
            details: req.body,
            subcategoryIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).save();
        } else {
          // ✅ Update existing document
          await Flexo.updateOne(
            { order_id },
            {
              $set: {
                details: req.body,
                subcategoryIds,
                updatedAt: new Date(),
              },
            }
          );
        }
      } else if (type === "DCut") {
        const existingDCut = await DcutBagmaking.findOne({ order_id });

        if (!existingDCut) {
          await new DcutBagmaking({
            order_id,
            status: "pending",
            details: req.body,
            subcategoryIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).save();
        } else {
          // ✅ Update existing document
          await DcutBagmaking.updateOne(
            { order_id },
            {
              $set: {
                details: req.body,
                subcategoryIds,
                updatedAt: new Date(),
              },
            }
          );
        }
      }

      res.status(200).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      console.error("Error updating or creating entry:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
  async productionStats(req, res) {
    try {
      const { agent } = req.query;

      // Fixed types
      const typeDCut = "d_cut_loop_handle";
      const typeWCut = "w_cut_box_bag";

      // Fetch both order lists
      const [dCutOrders, wCutOrders] = await Promise.all([
        SalesOrderService.getOrdersListWithProductionManager({
          agent,
          type: typeDCut,
        }),
        SalesOrderService.getOrdersListWithProductionManager({
          agent,
          type: typeWCut,
        }),
      ]);

      // Merge data
      const allOrders = [
        ...(dCutOrders.data || []),
        ...(wCutOrders.data || []),
      ];

      // Calculate stats
      const totalProducts = allOrders.length;
      const activeOrders = allOrders.filter(
        (o) => o.status === "pending"
      ).length;
      const completedOrders = allOrders.filter(
        (o) => o.status === "completed"
      ).length;
      const efficiency =
        totalProducts > 0
          ? ((completedOrders / totalProducts) * 100).toFixed(2)
          : 0;

      res.json({
        success: true,
        data: {
          totalProducts,
          activeOrders,
          completedOrders,
          efficiency: `${efficiency}%`,
        },
      });
    } catch (error) {
      logger.error("Error in productionStats controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listDCutBagmaking(req, res) {
    try {
      const { status, agent } = req.query;
      const type = "d_cut_loop_handle"; // Ensure type matches
      const orders = await SalesOrderService.getOrdersListWithProductionManager(
        { status, agent, type }
      );
      res.json({
        success: true,
        data: orders.data,
      });
    } catch (error) {
      logger.error("Error in get orders controller:", error);
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
          message: "Order not found",
        });
      }
      const productionManager = await ProductionManager.findOne({ order_id });
      const result = {
        order: order,
        production_manager: productionManager,
      };

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        "Error fetching order and production manager details:",
        error
      );
      res.status(500).json({
        success: false,
        message: error.message,
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
          production_manager: productionManager,
        },
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ProductionManagerController();
