const ProductionManager = require("../../models/ProductionManager");
const SalesOrder = require("../../models/SalesOrder");
const Subcategory = require("../../models/subcategory");
const logger = require("../../utils/logger");
const Opsert = require("../../models/Opsert");
const DcutBagmaking = require("../../models/DcutBagmaking");
const Report = require("../../models/Report");
const Invoice = require("../../models/Invoice");
const emailHelper = require("../helpers/emailHelper");
class DcutBagmakingController {
  async list(req, res) {
    try {
      // Step 1: Get all SalesOrder records with bagType "d_cut_loop_handle"
      const salesOrders = await SalesOrder.find({
        "bagDetails.type": "d_cut_loop_handle",
      })
        .select(
          "orderId bagDetails customerName email mobileNumber address jobName fabricQuality quantity agent status createdAt updatedAt"
        )
        .sort({ createdAt: -1 });

      console.log("salesOrderList----", salesOrders);

      if (!salesOrders || salesOrders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No Sales Orders found with the specified bagType",
        });
      }

      const orderIds = salesOrders.map((order) => order.orderId);
      console.log("orderIds----", orderIds);

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

      // Step 4: Get Dcutbagmaking records with status filter applied
      const DcutbagmakingRecords = await DcutBagmaking.find({
        order_id: { $in: orderIds },
        status: statusFilter, // Apply status filter here
      });

      console.log("Dcutbagmaking----", DcutbagmakingRecords);

      // Step 5: Merge the data from SalesOrders, ProductionManagers, and Dcutbagmaking records
      const result = salesOrders
        .map((order) => {
          const matchedProductionManagers = productionManagers.filter(
            (pm) => pm.order_id === order.orderId
          );
          const matchedDcutbagmaking = DcutbagmakingRecords.filter(
            (dcut) => dcut.order_id === order.orderId
          );

          if (
            matchedProductionManagers.length > 0 &&
            matchedDcutbagmaking.length > 0
          ) {
            return {
              ...order.toObject(),
              productionManagers: matchedProductionManagers,
              dcutbagmakingDetails: matchedDcutbagmaking,
            };
          }
        })
        .filter((order) => order !== undefined); // Filter out undefined entries

      console.log("Filtered result----", result);

      // Return the final result with merged data
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error listing D-Cut bag making entries:", error);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while fetching the entries. Please try again later.",
      });
    }
  }

  async verifyOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { materialId, scanData } = req.body;
      const { rollSize, gsm, fabricColor, quantity, id } = scanData;

      console.log(rollSize, gsm, fabricColor, quantity, materialId);

      // return false;
      // Fetch production details from ProductionManager
      const productionRecord = await ProductionManager.findOne({
        order_id: orderId,
      });
      if (!productionRecord)
        return res
          .status(404)
          .json({ success: false, message: "Production record not found." });
      console.log("productionRecord---------", productionRecord);

      // Fetch sales order details
      const salesOrder = await SalesOrder.findOne({ orderId: orderId });
      if (!salesOrder)
        return res
          .status(404)
          .json({ success: false, message: "Sales order not found." });
      console.log("salesOrder---------", salesOrder);

      // Extract correct fields
      const { color: FabricColor } = salesOrder.bagDetails;
      const { fabricQuality } = salesOrder;
      const { quantity_kgs, remaining_quantity } =
        productionRecord.production_details;
      console.log("Sales Order - Fabric Color:", FabricColor);
      console.log("Sales Order - Gsm:", gsm);
      console.log("Sales Order - Fabric Quality:", fabricQuality);
      console.log("Sales Order - rollSize:", rollSize);
      console.log("Sales Order - quantity_kgs:", quantity_kgs);

      // Fetch subcategory IDs from Flexo
      const existingRecord = await DcutBagmaking.findOne({ order_id: orderId });
      if (
        !existingRecord ||
        !existingRecord.subcategoryIds ||
        existingRecord.subcategoryIds.length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message: "No subcategories found for this order.",
          });
      }

      const subcategoryIds = existingRecord.subcategoryIds;

      // 3️⃣ Find the exact subcategory that matches all scanned properties
      const matchedSubcategory = await Subcategory.findOne({
        _id: id, // Must match the scanned subcategory ID
        rollSize: rollSize,
        gsm: gsm,
        fabricColor: fabricColor,
        quantity: quantity,
        status: "active",
      });

      console.log("matchedSubcategory:", matchedSubcategory);
      console.log("qr code id :", id);

      if (!matchedSubcategory) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid QR code. No matching subcategory found.",
          });
      }
      // 3️⃣ Check if the scanned subcategory ID exists inside this order's subcategories
      if (!existingRecord.subcategoryIds.includes(id)) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid QR code. Subcategory does not belong to this order.",
          });
      }
      if (id !== materialId) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Wrong QR code selected. Material does not match the expected quantity.",
          });
      }

      console.log("-----------------------------------------------");
      console.log("Matched Subcategory - GSM:", matchedSubcategory.gsm);
      console.log("Sales Order - GSM:", gsm);
      console.log(
        "Matched Subcategory - Fabric Color:",
        matchedSubcategory.fabricColor
      );
      console.log("Sales Order - Fabric Color:", fabricColor);
      console.log(
        "Matched Subcategory - Fabric Quality:",
        matchedSubcategory.fabricQuality
      );
      console.log("Sales Order - Fabric Quality:", fabricQuality);

      // Validate sales order details with subcategory
      if (
        matchedSubcategory.gsm === gsm &&
        matchedSubcategory.fabricColor === FabricColor &&
        matchedSubcategory.fabricQuality === fabricQuality &&
        matchedSubcategory.rollSize === rollSize
      ) {
        console.log("Updating Subcategory ID:", matchedSubcategory._id);

        const material = await Subcategory.findOne({ _id: materialId });
        if (!material)
          return res
            .status(400)
            .json({ success: false, message: "Invalid material ID." });

        // Find active subcategories
        const activeSubcategories = await Subcategory.find({
          _id: { $in: subcategoryIds },
          status: "active",
        });
        if (!activeSubcategories.length)
          return res
            .status(400)
            .json({
              success: false,
              message: "No active subcategories available.",
            });

        console.log(
          "---------------------------------------------------------"
        );

        console.log("activeSubcategories.length ", activeSubcategories.length);

        console.log("matchedSubcategory.quantity", matchedSubcategory.quantity);

        console.log("material.quantity ", material.quantity);

        console.log("material._id ", material._id);

        console.log("matchedSubcategory._id", matchedSubcategory._id);

        const remainingQuantity = Math.abs(
          remaining_quantity - matchedSubcategory.quantity
        );
        // Update subcategory and production records
        if (
          matchedSubcategory.quantity === material.quantity &&
          activeSubcategories.length > 1
        ) {
          await Subcategory.findByIdAndUpdate(matchedSubcategory._id, {
            status: "inactive",
          });
          await ProductionManager.findOneAndUpdate(
            { order_id: orderId },
            { "production_details.remaining_quantity": remainingQuantity },
            { new: true }
          );
        } else if (activeSubcategories.length === 1) {
          if (
            matchedSubcategory.quantity === material.quantity &&
            remainingQuantity == 0
          ) {
            await Subcategory.findByIdAndUpdate(material._id, {
              status: "inactive",
            });
          } else if (remainingQuantity !== 0) {
            // await Subcategory.findByIdAndUpdate(material._id, {
            //   quantity: remainingQuantity,
            // is_used: false,// ✅ update status to active
            // });
            await Subcategory.create({
              fabricColor: material.fabricColor,
              rollSize: material.rollSize,
              gsm: material.gsm,
              fabricQuality: material.fabricQuality,
              quantity: remainingQuantity, // your updated quantity
              category: material.category,
              is_used: false,
              status: "active",
              createdAt: new Date(),
            });
            // Mark old roll as inactive
            await Subcategory.findByIdAndUpdate(material._id, {
              status: "inactive",
            });
          }

          await ProductionManager.findOneAndUpdate(
            { order_id: orderId },
            { "production_details.remaining_quantity": 0 },
            { new: true }
          );
          await DcutBagmaking.updateOne(
            { order_id: orderId },
            { status: "in_progress" },
            { upsert: true }
          );
        }
        return res.json({
          success: true,
          message: "Order verification successful.",
          data: {
            productionDetails: productionRecord,
            subcategory: matchedSubcategory,
            salesOrder,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Order verification failed. Mismatch in sales order and subcategory details.",
        });
      }
    } catch (error) {
      console.error("Error verifying order:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateDcutBagMakingStatus(req, res) {
    try {
      // Log the request parameters
      console.log("req.params:", req.params);

      // Extract orderId from URL parameters and status, remarks from the request body
      const { orderId } = req.params;
      const { status, remarks, unitToUpdate } = req.body;

      // Log extracted values
      console.log("orderId:", orderId);
      console.log("status:", status);
      console.log("remarks:", remarks);

      // Define valid statuses
      const validStatuses = ["pending", "in_progress", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status provided. Valid statuses are 'pending', 'in_progress', or 'completed'.",
        });
      }

      // Find and update the D-Cut Bag Making record by orderId
      const dcutBagMaking = await DcutBagmaking.findOneAndUpdate(
        { order_id: orderId }, // Find record by orderId
        {
          status: status,
          remarks: remarks,
          unit_number: unitToUpdate,
        },
        { new: true, runValidators: true } // Return the updated document
      );

      console.log("dcutBagMaking:", dcutBagMaking); // Log updated document

      // Check if the record was found
      if (!dcutBagMaking) {
        return res.status(404).json({
          success: false,
          message: `No D-Cut Bag Making record found with orderId: ${orderId}`,
        });
      }

      // Return success response
      res.json({
        success: true,
        message: `D-Cut Bag Making status updated successfully to '${status}'`,
        data: dcutBagMaking,
      });
    } catch (error) {
      console.error("Error updating D-Cut Bag Making status:", error);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while updating the D-Cut Bag Making status. Please try again later.",
      });
    }
  }

  async handleMoveToOpsert(req, res) {
    const { orderId } = req.params;
    const { type, scrapQuantity } = req.body;
    try {
      // 1️⃣ Update ProductionManager progress to "D-Cut Opsert"
      const updatedProductionManager = await ProductionManager.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { "production_details.progress": "D-Cut Offset  printing" },
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

      // 3️⃣ Remove the DcutBagMaking record after updating
      // await DcutBagmaking.deleteOne({ order_id: orderId });

      // 2️⃣ Update Flexo (DcutBagMaking) status to "w_cut_bagmaking"
      const DcutBagmakingList = await DcutBagmaking.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { status: "delivered" }, // Change to "w_cut_bagmaking"
          scrapQuantity: scrapQuantity || 0,
        },
        { new: true }
      );

      if (!DcutBagmakingList) {
        return res.status(404).json({
          success: false,
          message: `No DcutBagmakingList record found for orderId: ${orderId}`,
        });
      }

      console.log("✅ DcutBagmakingList Updated:", DcutBagmakingList);

      console.log("✅ DcutBagMaking Record Removed for orderId:", orderId);

      // 4️⃣ Insert the removed record into the Reports table
      const ReportList = await Report.create({
        order_id: orderId,
        status: "completed",
        type: "d_cut_bag_making",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("✅ Report Record Created:", Report);

      // 3️⃣ Insert or update Opsert table with status "pending"
      const opsertRecord = await Opsert.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { updatedAt: new Date() }, // Update `updatedAt` timestamp
          $setOnInsert: { status: "pending", createdAt: new Date() }, // Set `status` only on insert
        },
        { upsert: true, new: true }
      );

      console.log("✅ Opsert Record Created/Updated:", opsertRecord);

      return res.status(200).json({
        success: true,
        message: "Order moved to Offset  successfully.",
        data: {
          productionManager: updatedProductionManager,
          opsert: opsertRecord,
        },
      });
    } catch (error) {
      console.error("❌ Error in handleMoveToOpsert:", error);
      return res.status(500).json({
        success: false,
        message:
          "An error occurred while moving the order to Offset . Please try again.",
      });
    }
  }

  async directBilling(req, res) {
    const { orderId } = req.params;
    const { type, scrapQuantity } = req.body;

    try {
      // 1️⃣ Find and remove the DcutBagmaking record
      const DcutBagmakingList = await DcutBagmaking.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { status: "delivered" }, // Change to "w_cut_bagmaking"
          scrapQuantity: scrapQuantity || 0,
        },
        { new: true }
      );

      if (!DcutBagmakingList) {
        return res.status(404).json({
          success: false,
          message: `No DcutBagmakingList record found for orderId: ${orderId}`,
        });
      }

      console.log("✅ DcutBagmakingList Updated:", DcutBagmakingList);

      console.log("---------Order id  is--------", orderId);
      // 2️⃣ Insert a record into the Invoice table
      const lastInvoice = await Invoice.findOne().sort({ invoice_id: -1 });

      // Get the numeric part of the last invoice ID (assuming format is "INV001", "INV002", etc.)
      const lastInvoiceId = lastInvoice ? lastInvoice.invoice_id : "INV000";
      const lastInvoiceNumber = parseInt(lastInvoiceId.replace("INV", "")) || 0;

      // Generate a new invoice ID by incrementing the last number
      const newInvoiceId = `INV${(lastInvoiceNumber + 1)
        .toString()
        .padStart(3, "0")}`;
      const invoiceRecord = await Invoice.create({
        invoice_id: newInvoiceId,
        order_id: orderId,
        status: "Pending",
        type: type,
        createdAt: new Date(),
      });
      console.log("✅ Invoice Record Created:", invoiceRecord);

      // 4️⃣ Insert the removed record into the Reports table
      const ReportList = await Report.create({
        order_id: orderId,
        status: "completed",
        type: "d_cut_bag_making",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Report Record Created:", Report);

      const updatedProductionManager = await ProductionManager.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { "production_details.progress": "Move to billing" },
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

      // 6️⃣ Find and update status in Sales Order
      const salesRecord = await SalesOrder.findOne({ orderId: orderId });

      console.log("salesRecord:", salesRecord);

      if (!salesRecord) {
        return res
          .status(404)
          .json({ message: "No sales record found for orderId" });
      }

      salesRecord.status = "completed";
      await salesRecord.save();

      // 7️⃣ Send Invoice Email (Ensure it doesn’t block execution)
      try {
        await emailHelper.sendInvoiceEmail(newInvoiceId);
        console.log("✅ Invoice Email Sent Successfully");
      } catch (emailError) {
        console.error("⚠️ Failed to send invoice email:", emailError);
      }

      return res.status(200).json({
        success: true,
        message: "Direct billing completed successfully.",
        data: { invoice: invoiceRecord },
      });
    } catch (error) {
      console.error("❌ Error in directBilling:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing direct billing.",
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate status transition
      if (updateData.status) {
        const currentEntry = await DcutBagmaking.findById(id);
        if (!currentEntry) {
          return res.status(404).json({
            success: false,
            message: "D-Cut bag making entry not found",
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

      const updatedEntry = await DcutBagmaking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          message: "D-Cut bag making entry not found",
        });
      }

      res.json({
        success: true,
        data: updatedEntry,
      });
    } catch (error) {
      logger.error("Error updating D-Cut bag making entry:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRecordsByType(req, res) {
    try {
      // Fetch all reports where type is 'w_cut_flexo'
      const reports = await Report.find({ type: "d_cut_bag_making" });

      // Fetch related sales orders and merge data
      const result = await Promise.all(
        reports.map(async (report) => {
          const salesOrder = await SalesOrder.findOne({
            orderId: report.order_id,
          });

          return {
            orderId: report.order_id,
            status: report.status,
            jobName: salesOrder ? salesOrder.jobName : "N/A",
            bagType: salesOrder ? report.type : "N/A",
            quantity: salesOrder ? salesOrder.quantity : "N/A",
            customer: salesOrder ? salesOrder.customerName : "N/A",
            contact: salesOrder ? salesOrder.mobileNumber : "N/A",
            createdAt: report.createdAt,
          };
        })
      );
      console.log("result is ", result);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching records", error });
    }
  }

  async getRecordsBagmakingByType(req, res) {
    try {
      // Fetch all reports where type is 'w_cut_flexo'
      const reports = await Report.find({ type: "d_cut_opsert" });

      // Fetch related sales orders and merge data
      const result = await Promise.all(
        reports.map(async (report) => {
          const salesOrder = await SalesOrder.findOne({
            orderId: report.order_id,
          });

          return {
            orderId: report.order_id,
            status: report.status,
            jobName: salesOrder ? salesOrder.jobName : "N/A",
            bagType: salesOrder ? report.type : "N/A",
            quantity: salesOrder ? salesOrder.quantity : "N/A",
            customer: salesOrder ? salesOrder.customerName : "N/A",
            contact: salesOrder ? salesOrder.mobileNumber : "N/A",
            createdAt: report.createdAt,
          };
        })
      );
      console.log("getRecordsBagmakingByType", result);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching records", error });
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
      const entries = await DcutBagmaking.find(query).sort({ createdAt: -1 });

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
      logger.error("Error generating D-Cut bag making report:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async listMaterials(req, res) {
    try {
      const { orderId } = req.params;
      console.log("orderid", orderId);
      // Fetch existing production record
      const existingRecord = await DcutBagmaking.findOne({ order_id: orderId });
      console.log("existingRecord", existingRecord);
      if (!existingRecord) {
        return res
          .status(404)
          .json({ success: false, message: "Records not found" });
      }
      // Extract subcategory IDs from Flexo table
      const subcategoryIds = existingRecord.subcategoryIds || [];
      if (subcategoryIds.length === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "No Row Material found for this order",
          });
      }
      // Fetch sales record
      // Fetch matching subcategory records
      const subcategoryMatches = await Subcategory.find({
        _id: { $in: subcategoryIds }, // Filter by the subcategory IDs from Flexo
        // status: 'active'
      });

      console.log("subcategoryMatches", subcategoryMatches);
      if (!subcategoryMatches || subcategoryMatches.length === 0) {
        return res.json({
          success: false,
          totalQuantity: 0,
          requiredMaterials: [],
          message: "No Row Material found for this order",
        });
      }

      const productionRecord = await ProductionManager.findOne({
        order_id: orderId,
      });
      if (!productionRecord) {
        return res.status(404).json({
          success: false,
          message: "Production record not found for the given order ID.",
        });
      }
      const { remaining_quantity } = productionRecord.production_details;
      // Calculate total quantity from subcategories
      // let totalQuantity = subcategoryMatches.reduce((sum, subcategory) => sum + (subcategory.quantity || 0), 0);

      let totalQuantity = Number.isFinite(remaining_quantity)
        ? Math.abs(remaining_quantity)
        : 0;

      const requiredMaterials = subcategoryMatches.map((subcategory) => {
        const subcategoryPlain = JSON.parse(JSON.stringify(subcategory));
        return {
          _id: subcategoryPlain._id,
          fabricColor: subcategoryPlain.fabricColor,
          rollSize: subcategoryPlain.rollSize,
          gsm: subcategoryPlain.gsm,
          fabricQuality: subcategoryPlain.fabricQuality,
          quantity: subcategoryPlain.quantity,
          category: subcategoryPlain.category,
          status: subcategoryPlain.status || "unknown",
        };
      });
      console.log("requiredMaterials", requiredMaterials);
      // return false;
      const firstSubcategory = subcategoryMatches[0];
      res.json({
        success: true,
        totalQuantity,
        rollSize: firstSubcategory.rollSize,
        quantityRolls: subcategoryMatches.length,
        requiredMaterials,
      });
    } catch (error) {
      logger.error("Error fetching materials:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DcutBagmakingController();
