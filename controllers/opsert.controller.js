const Delivery = require("../models/Delivery");
const Opsert = require("../models/Opsert");
const Package = require("../models/Package");
const ProductionManager = require("../models/ProductionManager");
const Report = require("../models/Report");
const SalesOrder = require("../models/SalesOrder");
const logger = require("../utils/logger");

class OpsertController {
  // List orders with the status filter
  static async listOrders(req, res) {
    const { status } = req.query;
    try {
      // Step 1: Get all SalesOrder records with bagType "d_cut_loop_handle"
      const salesOrders = await SalesOrder.find({
        "bagDetails.type": "d_cut_loop_handle",
      })
        .select(
          "orderId bagDetails customerName email mobileNumber address jobName fabricQuality quantity agent status createdAt updatedAt"
        )
        .sort({ createdAt: -1 });

      if (!salesOrders || salesOrders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No Sales Orders found with the specified bagType",
        });
      }

      const orderIds = salesOrders.map((order) => order.orderId);

      // Step 2: Get the status from the query parameter (defaults to 'pending' if not provided)
      const statusFilter = req.query.status || "pending"; // Default to 'pending'
      const validStatuses = ["pending", "in_progress", "completed"];

      // Validate the status filter
      if (!validStatuses.includes(statusFilter)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status provided. Valid statuses are 'pending', 'in_progress', or 'completed'.",
        });
      }

      // Step 3: Get ProductionManager records (no status filter applied here)
      const productionManagers = await ProductionManager.find({
        order_id: { $in: orderIds },
      });

      console.log("productionManagers----", productionManagers);

      if (!productionManagers || productionManagers.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: `No active production manager orders found.`,
        });
      }

      // Step 4: Get Opsert records with status filter applied
      const opsertRecords = await Opsert.find({
        order_id: { $in: orderIds },
        status: statusFilter, // Apply status filter here
      }).sort({ createdAt: -1 });

      console.log("Opsert records----", opsertRecords);

      // Step 5: Merge the data from SalesOrders, ProductionManagers, and Opsert records
      const result = salesOrders
        .map((order) => {
          const matchedProductionManagers = productionManagers.filter(
            (pm) => pm.order_id === order.orderId
          );
          const matchedOpserts = opsertRecords.filter(
            (opsert) => opsert.order_id === order.orderId
          );

          if (
            matchedProductionManagers.length > 0 &&
            matchedOpserts.length > 0
          ) {
            return {
              ...order.toObject(),
              productionManagers: matchedProductionManagers,
              opsertDetails: matchedOpserts,
            };
          }
        })
        .filter((order) => order !== undefined); // Filter out undefined entries

      // Return the final result with merged data
      res.json({
        success: true,
        data: result,
        debuger: true,
      });
    } catch (error) {
      console.error("Error listing Offset entries:", error);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while fetching the entries. Please try again later.",
      });
    }
  }

  static async updateOrderStatus(req, res) {
    const { id } = req.params; // Order ID from route params
    const { status, unitToUpdate, remarks } = req.body; // Status and remarks from request body

    console.log("id", id);
    console.log(status, remarks);
    try {
      // Find the opsert record matching the order ID and status filter (only one record)
      const opsertRecord = await Opsert.findOne({
        order_id: id, // Use `id` directly for filtering
      });
      console.log("opsertRecord", opsertRecord);
      if (!opsertRecord) {
        return res.status(404).json({ message: "Offset  record not found" });
      }

      // Update the status and remarks for the found record
      opsertRecord.status = status;
      opsertRecord.remarks = remarks || opsertRecord.remarks; // Keep old remarks if not provided
      opsertRecord.unit_number = unitToUpdate || opsertRecord.unitToUpdate;
      await opsertRecord.save(); // Save the updated record

      return res.status(200).json({
        success: true,
        message: "Offset  record status updated successfully",
        opsertRecord,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error updating order status" });
    }
  }

  static async moveToDelivery(req, res) {
    const { id } = req.params;
    // const { scrapQuantity } = req.body;
    try {
      // Step 1: Update status in `orders_opsert` table to "delivery"
      const opsertRecord = await Opsert.findOne({
        order_id: id, // Use `id` directly for filtering
      });
      console.log("opsertRecord", opsertRecord);
      if (!opsertRecord) {
        return res.status(404).json({ message: "Offset record not found" });
      }

      opsertRecord.status = "delivered";
      // if (scrapQuantity !== undefined) {
      //   opsertRecord.scrapQuantity = scrapQuantity;
      // }
      await opsertRecord.save();

      // Step 2: Find and update `production_manager` table
      const updatedProductionManager = await ProductionManager.findOneAndUpdate(
        { order_id: id },
        {
          $set: { "production_details.progress": "Move to Packaging" },
        },
        { new: true }
      );

      if (!updatedProductionManager) {
        return res.status(404).json({
          success: false,
          message: `No Production Manager record found for orderId: ${orderId}`,
        });
      }

      console.log("✅ ProductionManager Updated:", updatedProductionManager);

      // 4️⃣ Insert the removed record into the Reports table
      const ReportList = await Report.create({
        order_id: id,
        status: "completed",
        type: "d_cut_opsert",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Report Record Created:", Report);

      // Step 3: Create entry in `packaging` table with status "pending"
      await Package.create({
        order_id: id,
        status: "pending",
      });

      return res
        .status(200)
        .json({ message: "Order moved to packaging successfully" });
    } catch (error) {
      console.error("Error moving order to packaging:", error);
      return res
        .status(500)
        .json({ message: "Failed to move order to packaging" });
    }
  }

  async listOpsertList(req, res) {
    try {
      const { status, jobName, bagType, page = 1, limit = 10 } = req.query;
      const query = {};

      // Apply filters if provided
      if (status) query.status = status;
      if (jobName) query.jobName = new RegExp(jobName, "i");
      if (bagType) query.bagType = bagType;

      const skip = (page - 1) * limit;

      const [entries, total] = await Promise.all([
        Opsert.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Opsert.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: entries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNextPage: skip + entries.length < total,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      logger.error("Error listing opsert entries:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate status transition
      if (updateData.status) {
        const currentEntry = await Opsert.findById(id);
        if (!currentEntry) {
          return res.status(404).json({
            success: false,
            message: "Opsert entry not found",
          });
        }

        // Validate status transition
        const validTransitions = {
          pending: ["in_progress"],
          in_progress: ["completed"],
          completed: [],
        };

        if (
          !validTransitions[currentEntry.status]?.includes(updateData.status)
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid status transition from ${currentEntry.status} to ${updateData.status}`,
          });
        }
      }

      const updatedEntry = await Opsert.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          message: "Opsert entry not found",
        });
      }

      res.json({
        success: true,
        data: updatedEntry,
      });
    } catch (error) {
      logger.error("Error updating opsert entry:", error);
      res.status(400).json({
        success: false,
        message: error.message,
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
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "weekly":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          endDate = new Date(now);
          endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
          break;
        case "yearly":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case "custom":
          if (!start_date || !end_date) {
            return res.status(400).json({
              success: false,
              message:
                "start_date and end_date are required for custom time range",
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
          $lte: endDate,
        };
      }

      // Add status filter if provided
      if (status) {
        query.status = status;
      }

      // Get entries and calculate statistics
      const entries = await Opsert.find(query).sort({ createdAt: -1 });

      // Calculate statistics
      const statistics = {
        total: entries.length,
        byStatus: {
          pending: entries.filter((e) => e.status === "pending").length,
          in_progress: entries.filter((e) => e.status === "in_progress").length,
          completed: entries.filter((e) => e.status === "completed").length,
        },
        totalQuantity: entries.reduce((sum, entry) => sum + entry.quantity, 0),
      };

      res.json({
        success: true,
        data: {
          entries,
          statistics,
          timeRange: {
            start: startDate || "all-time",
            end: endDate || "all-time",
          },
        },
      });
    } catch (error) {
      logger.error("Error generating opsert report:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = OpsertController; // Ensure proper export
