const WcutBagmaking = require("../../models/WcutBagmaking");
const ProductionManager = require("../../models/ProductionManager");
const SalesOrder = require("../../models/SalesOrder");
const Subcategory = require("../../models/subcategory");
const { ObjectId } = require("mongodb"); // Import ObjectId
const emailHelper = require("../helpers/emailHelper");

const Flexo = require("../../models/Flexo");
const logger = require("../../utils/logger");
const Delivery = require("../../models/Delivery");
const Report = require("../../models/Report");
const Invoice = require("../../models/Invoice");
const Package = require("../../models/Package");

class WcutBagmakingController {
  async list(req, res) {
    try {
      // Step 1: Get all SalesOrder records with bagType "w_cut_box_bag"
      const salesOrders = await SalesOrder.find({
        "bagDetails.type": "w_cut_box_bag",
      })
        .select(
          "orderId bagDetails customerName email mobileNumber address jobName fabricQuality quantity agent status createdAt updatedAt"
        )
        .sort({ createdAt: -1 });

      console.log("salesOrderList----", salesOrders);

      // Check if salesOrders is empty
      if (!salesOrders || salesOrders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No Sales Orders found with the specified bagType",
        });
      }

      // Step 2: Extract all orderIds from SalesOrder
      const orderIds = salesOrders.map((order) => order.orderId);
      console.log("orderIds----", orderIds);

      // Step 3: Get the status from query parameter (defaults to 'pending' if not provided)
      const statusFilter = req.query.status || "pending"; // Default to 'pending' if no status is provided
      const validStatuses = ["pending", "in_progress", "completed"]; // List of valid statuses

      // Validate the status filter
      if (!validStatuses.includes(statusFilter)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status provided. Valid statuses are 'pending', 'in_progress', or 'completed'.",
        });
      }
      // Step 4: Get matching ProductionManager records based on order_id and status filter
      const productionManagers = await ProductionManager.find({
        order_id: { $in: orderIds },
      });
      console.log("productionManagers----", productionManagers);
      // Extract order IDs that have production manager records
      const productionOrderIds = productionManagers.map((pm) => pm.order_id);
      // Step 5: Get only Flexo records that match the order_id present in production managers and status 'pending'
      console.log("filer data--------------", orderIds);
      const flexoRecords = await Flexo.find({
        order_id: { $in: orderIds },
        status: statusFilter,
      }).sort({ createdAt: -1 }); // Sort in descending order

      console.log("flexoRecords----", flexoRecords);

      // Step 6: Merge SalesOrder, ProductionManager, and Flexo records
      const result = salesOrders
        .map((order) => {
          // Find matching production managers
          const matchedProductionManagers = productionManagers.filter(
            (pm) => pm.order_id === order.orderId
          );

          // Find matching flexo records
          const matchedFlexoRecords = flexoRecords.filter(
            (flexo) => flexo.order_id === order.orderId
          );

          // Only return records where both ProductionManager and Flexo exist
          if (
            matchedProductionManagers.length > 0 &&
            matchedFlexoRecords.length > 0
          ) {
            return {
              ...order.toObject(),
              productionManagers: matchedProductionManagers,
              flexoDetails: matchedFlexoRecords,
            };
          }
        })
        .filter((order) => order !== undefined); // Remove undefined values

      console.log("Filtered result----", result);

      // Return the filtered response
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error listing Sales Orders:", error);
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

      // Fetch production details
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
      console.log("Sales Order - GSM:", gsm);
      console.log("Sales Order - Fabric Quality:", fabricQuality);
      console.log("Sales Order - rollSize:", rollSize);
      console.log("Production Record - quantity_kgs:", quantity_kgs);

      // Fetch subcategory IDs from Flexo
      const existingRecord = await Flexo.findOne({ order_id: orderId });
      if (
        !existingRecord ||
        !existingRecord.subcategoryIds ||
        existingRecord.subcategoryIds.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "No subcategories found for this order",
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

      if (!matchedSubcategory) {
        return res.status(400).json({
          success: false,
          message: "Invalid QR code. No matching subcategory found.",
        });
      }
      // 3️⃣ Check if the scanned subcategory ID exists inside this order's subcategories
      if (!existingRecord.subcategoryIds.includes(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid QR code. Subcategory does not belong to this order.",
        });
      }
      if (id !== materialId) {
        return res.status(400).json({
          success: false,
          message:
            "Wrong QR code selected. Material does not match the expected quantity.",
        });
      }

      console.log("-----------------------------------------------");
      console.log("Matched Subcategory - subcategoryIds:", subcategoryIds);
      console.log("Matched Subcategory - GSM:", matchedSubcategory.gsm);
      console.log(
        "Matched Subcategory - Fabric Color:",
        matchedSubcategory.fabricColor
      );
      console.log(
        "Matched Subcategory - Fabric Quality:",
        matchedSubcategory.fabricQuality
      );
      console.log(
        "Matched Subcategory - rollSize:",
        matchedSubcategory.rollSize
      );
      console.log(
        "Matched Subcategory - quantity:",
        matchedSubcategory.quantity
      );

      // Validate sales order details with subcategory
      if (
        matchedSubcategory.gsm === gsm &&
        matchedSubcategory.fabricColor === FabricColor &&
        matchedSubcategory.fabricQuality === fabricQuality &&
        matchedSubcategory.rollSize === rollSize
      ) {
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
          return res.status(400).json({
            success: false,
            message: "No active subcategories available.",
          });

        console.log(
          "---------------------------------------------------------"
        );

        console.log("remainingQuantity", remaining_quantity);
        console.log("activeSubcategories.length ", activeSubcategories.length);

        console.log("matchedSubcategory.quantity", matchedSubcategory.quantity);

        console.log("material.quantity ", material.quantity);

        console.log("material._id ", material._id);

        console.log("matchedSubcategory._id", matchedSubcategory._id);

        // return false;
        const remainingQuantity = Math.abs(
          remaining_quantity - matchedSubcategory.quantity
        );

        console.log("remainingQuantity", remainingQuantity);
        // return false;
        console.log(
          "---------------------------------------------------------"
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
          // return false;
          // remainingQuantity === matchedSubcategory.quantity
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
            //   is_used: false, // ✅ update status to active
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
          await Flexo.updateOne(
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

  async updateProductionManagerStatus(req, res) {
    try {
      // Step 1: Log the entire params object to see if the orderId is there
      console.log("req.params:", req.params); // Log entire params object

      // Extract the orderId from the URL parameters
      const { orderId } = req.params; // OrderId from URL parameters
      const { status, remarks, unitToUpdate } = req.body; // status and remarks from the body of the request

      // Log the extracted orderId, status, and remarks
      console.log("orderId:", orderId);
      console.log("status:", status);
      console.log("remarks:", remarks);
      console.log("unitToUpdate:", unitToUpdate);

      // Step 2: Validate the status
      const validStatuses = ["pending", "in_progress", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status provided. Valid statuses are 'pending', 'in_progress', or 'completed'.",
        });
      }
      // Step 3: Find and update the ProductionManager document by orderId
      const flexo = await Flexo.findOneAndUpdate(
        { order_id: orderId }, // Find by the orderId
        {
          status: status, // Update the status field
          remarks: remarks || "",
          unit_number: unitToUpdate,
        },
        { new: true, runValidators: true } // Return the updated document
      );

      console.log("flexo:", flexo); // Log the flexo document

      // Step 4: Check if the flexo was found
      if (!flexo) {
        return res.status(404).json({
          success: false,
          message: `No Production Manager found with orderId: ${orderId}`,
        });
      }

      // Step 5: Return the updated flexo
      res.json({
        success: true,
        message: `Production Manager status updated successfully to '${status}'`,
        data: flexo,
      });
    } catch (error) {
      console.error("Error updating Production Manager status:", error);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while updating the Production Manager status. Please try again later.",
      });
    }
  }

  async handleMoveToBagmaking(req, res) {
    const { orderId } = req.params;

    console.log(" req.body", req.body);
    // return false;
    try {
      // 1️⃣ Update ProductionManager progress to "W-Cut Bag Making"
      const updatedProductionManager = await ProductionManager.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { "production_details.progress": "W-Cut Bag Making" },
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

      // 2️⃣ Update Flexo (DcutBagMaking) status to "w_cut_bagmaking"
      const updatedFlexo = await Flexo.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { status: "delivered" }, // Change to "w_cut_bagmaking"
        },
        { new: true }
      );

      if (!updatedFlexo) {
        return res.status(404).json({
          success: false,
          message: `No Flexo record found for orderId: ${orderId}`,
        });
      }

      console.log("✅ Flexo Updated:", updatedFlexo);

      // 3️⃣ Insert or update WcutBagmaking table with status "pending"
      const wcutBagmakingRecord = await WcutBagmaking.findOneAndUpdate(
        { order_id: orderId },
        {
          $set: { updatedAt: new Date() }, // Update `updatedAt` timestamp
          $setOnInsert: { status: "pending", createdAt: new Date() }, // Set `status` only on insert
        },
        { upsert: true, new: true }
      );

      console.log(
        "✅ WcutBagmaking Record Created/Updated:",
        wcutBagmakingRecord
      );

      const ReportList = await Report.create({
        order_id: orderId,
        status: "completed",
        type: "w_cut_flexo",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Report Inserted:", ReportList);

      return res.status(200).json({
        success: true,
        message: "Order moved to W-Cut Bagmaking successfully.",
        data: {
          productionManager: updatedProductionManager,
          flexo: updatedFlexo,
          wcutBagmaking: wcutBagmakingRecord,
        },
      });
    } catch (error) {
      console.error("❌ Error in handleMoveToBagmaking:", error);
      return res.status(500).json({
        success: false,
        message:
          "An error occurred while moving the order to W-Cut Bagmaking. Please try again.",
      });
    }
  }

  // List orders with the status filter
  async listOrders(req, res) {
    const { status } = req.query;
    try {
      // Step 1: Get all SalesOrder records with bagType "d_cut_loop_handle"
      const salesOrders = await SalesOrder.find({
        "bagDetails.type": "w_cut_box_bag",
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

      // Step 4: Get Opsert records with status filter applied
      const opsertRecords = await WcutBagmaking.find({
        order_id: { $in: orderIds },
        status: statusFilter, // Apply status filter here
      });

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

      console.log("Filtered result----", result);

      // Return the final result with merged data
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error listing Offset  entries:", error);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while fetching the entries. Please try again later.",
      });
    }
  }

  async updateOrderStatus(req, res) {
    const { id } = req.params; // Order ID from route params
    const { status, unitToUpdate, remarks } = req.body; // Status and remarks from request body

    console.log("id", id);
    console.log(status, remarks);
    try {
      // Find the opsert record matching the order ID and status filter (only one record)
      const opsertRecord = await WcutBagmaking.findOne({
        order_id: id, // Use `id` directly for filtering
      });
      console.log("opsertRecord", opsertRecord);
      if (!opsertRecord) {
        return res.status(404).json({ message: "BagMaking record not found" });
      }

      // Update the status and remarks for the found record
      opsertRecord.status = status;
      opsertRecord.remarks = remarks || opsertRecord.remarks;
      opsertRecord.unit_number = unitToUpdate || opsertRecord.unitToUpdate;

      await opsertRecord.save(); // Save the updated record

      return res.status(200).json({
        success: true,
        message: "BagMaking record status updated successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error updating order status" });
    }
  }

  async moveToDelivery(req, res) {
    const { id } = req.params;
    const { scrapQuantity } = req.body;
    try {
      // Step 1: Update status in `orders_opsert` table to "delivery"
      const opsertRecord = await WcutBagmaking.findOne({
        order_id: id, // Use `id` directly for filtering
      });

      console.log("opsertRecord", opsertRecord); // Make sure the record is found

      if (!opsertRecord) {
        return res.status(404).json({ message: "Offset  record not found" });
      }

      opsertRecord.status = "delivered"; // Use "delivery", not "delivered"
      if (scrapQuantity !== undefined) {
        opsertRecord.scrapQuantity = scrapQuantity;
      }
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

      const ReportList = await Report.create({
        order_id: id,
        status: "completed",
        type: "w_cut_bag_making",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Report Inserted:", ReportList);

      // Step 3: Create entry in `delivery` table with status "pending"
      await Package.create({
        order_id: id,
        status: "pending",
      });
      return res
        .status(200)
        .json({ message: "Order moved to delivery successfully" });
    } catch (error) {
      console.error("Error moving order to delivery:", error);
      return res
        .status(500)
        .json({ message: "Failed to move order to delivery" });
    }
  }

  async directBilling(req, res) {
    const { orderId } = req.params;
    const { type } = req.body;

    try {
      // 1️⃣ Find and remove the DcutBagmaking record
      const opsertRecord = await Flexo.findOne({
        order_id: orderId,
      });

      console.log("opsertRecord", opsertRecord);

      if (!opsertRecord) {
        return res
          .status(404)
          .json({ message: "No W-Cut Bag Making record found for orderId" });
      }

      opsertRecord.status = "delivered";
      await opsertRecord.save();

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
        type: "w_cut_flexo",
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
        const currentEntry = await WcutBagmaking.findById(id);
        if (!currentEntry) {
          return res.status(404).json({
            success: false,
            message: "W-Cut bag making entry not found",
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

      const updatedEntry = await WcutBagmaking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          message: "W-Cut bag making entry not found",
        });
      }

      res.json({
        success: true,
        data: updatedEntry,
      });
    } catch (error) {
      logger.error("Error updating W-Cut bag making entry:", error);
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
      const entries = await WcutBagmaking.find(query).sort({ createdAt: -1 });

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
      logger.error("Error generating W-Cut bag making report:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRecordsByType(req, res) {
    try {
      // Fetch all reports where type is 'w_cut_flexo'
      const reports = await Report.find({ type: "w_cut_flexo" });

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
      const reports = await Report.find({ type: "w_cut_bag_making" });

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
  // Update a record
  // async updateProductionManagerStatus(req, res) {
  //   try {
  //     const { orderId } = req.params;
  //     const updatedRecord = await Report.findOneAndUpdate(
  //       { order_id: orderId },
  //       req.body,
  //       { new: true }
  //     );

  //     if (!updatedRecord) {
  //       return res.status(404).json({ message: 'Record not found' });
  //     }

  //     res.status(200).json(updatedRecord);
  //   } catch (error) {
  //     res.status(500).json({ message: 'Error updating record', error });
  //   }
  // }

  // Delete a record permanently
  async deleteRecord(req, res) {
    try {
      const { orderId } = req.params;
      const deletedRecord = await Report.findOneAndDelete({
        order_id: orderId,
      });

      if (!deletedRecord) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting record", error });
    }
  }
  async listMaterials(req, res) {
    try {
      const { orderId } = req.params;
      console.log("orderid", orderId);
      // Fetch existing production record
      const existingRecord = await Flexo.findOne({ order_id: orderId });
      console.log("existingRecord", existingRecord);
      if (!existingRecord) {
        return res
          .status(404)
          .json({ success: false, message: "Records not found" });
      }
      // Extract subcategory IDs from Flexo table
      const subcategoryIds = existingRecord.subcategoryIds || [];
      if (subcategoryIds.length === 0) {
        return res.status(404).json({
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

module.exports = new WcutBagmakingController();
