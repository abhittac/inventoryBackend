const Package = require('../../models/Package');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const SalesOrder = require('../../models/SalesOrder');
const Delivery = require('../../models/Delivery');
const ProductionManager = require('../../models/ProductionManager');
const Flexo = require('../../models/Flexo');
const WcutBagmaking = require('../../models/WcutBagmaking');
const DcutBagmaking = require('../../models/DcutBagmaking');
const Opsert = require('../../models/Opsert');


class PackageController {
  async create(req, res) {
    try {
      const { order_id, package_details } = req.body;

      // Validate required fields
      if (!order_id || !Array.isArray(package_details) || package_details.length === 0) {
        return res.status(400).json({
          success: false,
          message: "order_id and package_details (non-empty array) are required."
        });
      }

      // Validate each package detail
      for (const pkg of package_details) {
        if (
          typeof pkg.length !== "number" ||
          typeof pkg.width !== "number" ||
          typeof pkg.height !== "number" ||
          typeof pkg.weight !== "number"
        ) {
          return res.status(400).json({
            success: false,
            message: "Each package detail must have numeric length, width, height, and weight."
          });
        }
      }

      // Find the existing package by order_id
      let existingPackage = await Package.findOne({ order_id });

      if (existingPackage) {
        // Append new package_details to the existing package
        existingPackage.package_details.push(...package_details);
        existingPackage.updatedAt = new Date();
        await existingPackage.save();

        return res.status(200).json({
          success: true,
          data: existingPackage
        });
      } else {
        // If no package exists for the given order_id, create a new package
        const pkg = new Package({
          order_id,
          package_details
        });

        await pkg.save();

        return res.status(201).json({
          success: true,
          data: pkg
        });
      }
    } catch (error) {
      logger.error('Error creating package:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async createPackage(req, res) {
    try {
      const { order_id, package_details } = req.body;

      console.log('req.body', req.body);
      // Validate required fields
      if (!order_id || !Array.isArray(package_details) || package_details.length === 0) {
        return res.status(400).json({
          success: false,
          message: "order_id and package_details (non-empty array) are required."
        });
      }

      // Validate each package detail
      for (const pkg of package_details) {
        if (typeof pkg.weight !== "number") {
          return res.status(400).json({
            success: false,
            message: "Each package detail must have a numeric weight."
          });
        }

        // Optional fields can be undefined or null, or numbers
        if (
          (pkg.length !== undefined && pkg.length !== null && typeof pkg.length !== "number") ||
          (pkg.width !== undefined && pkg.width !== null && typeof pkg.width !== "number") ||
          (pkg.height !== undefined && pkg.height !== null && typeof pkg.height !== "number")
        ) {
          return res.status(400).json({
            success: false,
            message: "Optional fields (length, width, height) must be numbers, null, or undefined."
          });
        }
      }

      // ✅ Step 1: Fetch the order to get total quantity
      const order = await SalesOrder.findOne({ orderId: order_id });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found."
        });
      }
      const totalQuantity = order.quantity;

      // ✅ Step 2: Get existing package weight (if any)
      let existingPackage = await Package.findOne({ order_id });
      let existingWeight = 0;

      if (existingPackage && Array.isArray(existingPackage.package_details)) {
        existingWeight = existingPackage.package_details.reduce((sum, pkg) => sum + (pkg.weight || 0), 0);
      }

      // ✅ Step 3: Sum new incoming weights
      const newWeight = package_details.reduce((sum, pkg) => sum + pkg.weight, 0);

      // ✅ Step 4: Check if total weight exceeds quantity + 10
      const allowedLimit = totalQuantity + 10;
      const totalWeightAfterAdd = existingWeight + newWeight;

      if (totalWeightAfterAdd > allowedLimit) {
        return res.status(400).json({
          success: false,
          message: `Total weight after adding (${totalWeightAfterAdd}) exceeds allowed limit (${allowedLimit}).`
        });
      }


      if (existingPackage) {
        // Append new package_details to the existing package
        existingPackage.package_details.push(...package_details);
        existingPackage.updatedAt = new Date();
        await existingPackage.save();

        return res.status(200).json({
          success: true,
          message: "Package details updated successfully.",
          data: existingPackage
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Order ID not found. Cannot add package details."
        });
      }
    } catch (error) {
      logger.error(`Error updating package: ${error.message}`, error);
      res.status(500).json({
        success: false,
        message: "Failed to update package details.",
        error: error.message
      });
    }
  }

  async getOrders(req, res) {
    try {
      const orders = await Package.find().sort({ _id: -1 }).select('status _id order_id package_details');
      const ordersWithPackages = await Promise.all(
        orders.map(async (packageItem) => {
          const order = await SalesOrder.findOne({ orderId: packageItem.order_id }); // Fetch the corresponding order
          const totalWeight = packageItem.package_details?.reduce((sum, pkg) => sum + pkg.weight, 0) || 0;
          return {
            ...packageItem.toObject(),
            order,
            totalWeight,
          };
        })
      );

      res.json({
        success: true,
        data: ordersWithPackages,
      });
    } catch (error) {
      logger.error('Error in getOrders controller:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }



  async updatePackageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // The new status is sent in the request body

      // Find the package using orderId and packageId
      const packageToUpdate = await Package.findOne({
        _id: id,
      });

      console.log('packageToUpdate', packageToUpdate);
      if (!packageToUpdate) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Update the package's status
      packageToUpdate.status = status;
      await packageToUpdate.save();

      // If the status is "delivered", check the Delivery table
      if (status === "delivery") {

        const updatedProductionManager = await ProductionManager.findOneAndUpdate(
          { order_id: packageToUpdate.order_id },
          {
            $set: { "production_details.progress": "Delivery Pending" }
          },
          { new: true }
        );

        if (!updatedProductionManager) {
          return res.status(404).json({
            success: false,
            message: `No Production Manager record found for orderId: ${orderId}`
          });
        }

        console.log("✅ ProductionManager Updated:", updatedProductionManager);

        const existingDelivery = await Delivery.findOne({ orderId: packageToUpdate.order_id });

        if (existingDelivery) {
          // Update status if delivery entry already exists
          existingDelivery.status = "pending";
          await existingDelivery.save();
        } else {
          // Create new entry if it doesn't exist
          await Delivery.create({
            orderId: packageToUpdate.order_id,
            status: "pending"
          });
        }
      }
      return res.status(200).json({ message: "Package status updated", package: packageToUpdate });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }

  }


  async getByOrderId(req, res) {
    try {
      console.log('Listing data for Order ID:', req.params.orderId);

      // Find the sales order with the given orderId
      const salesOrder = await SalesOrder.findOne({ orderId: req.params.orderId });

      if (!salesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        });
      }

      // Find all packages for the given order
      const packages = await Package.find({ order_id: salesOrder.orderId });

      if (!packages || packages.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No packages found for this order'
        });
      }

      // Update package timestamps (optional)
      await Package.updateMany(
        { order_id: salesOrder.orderId },
        { updatedAt: new Date() } // Updating the timestamp
      );

      // Calculate total weight
      let totalWeight = 0;

      // Fetch unit numbers based on bag type
      let flexoUnitNumber = "N/A";
      let wcutUnitNumber = "N/A";
      let dcutUnitNumber = "N/A";
      let opsertUnitNumber = "N/A";

      if (salesOrder?.bagDetails?.type === "w_cut_box_bag") {
        const flexoData = await Flexo.findOne({ order_id: salesOrder.orderId });
        const wcutData = await WcutBagmaking.findOne({ order_id: salesOrder.orderId });

        flexoUnitNumber = flexoData?.unit_number || "N/A";
        wcutUnitNumber = wcutData?.unit_number || "N/A";

      } else if (salesOrder?.bagDetails?.type === "d_cut_loop_handle") {
        const dcutData = await DcutBagmaking.findOne({ order_id: salesOrder.orderId });
        const opsertData = await Opsert.findOne({ order_id: salesOrder.orderId });

        dcutUnitNumber = dcutData?.unit_number || "N/A";
        opsertUnitNumber = opsertData?.unit_number || "N/A";
      }

      // Process packages and calculate total weight
      const ordersWithPackages = packages.map(packageItem => {
        const packageWeight = packageItem.package_details?.reduce((sum, pkg) => sum + pkg.weight, 0) || 0;
        totalWeight += packageWeight;
        return packageItem.toObject();
      });

      console.log('Package listing:', ordersWithPackages);
      res.json({
        success: true,
        salesOrder,
        packages: ordersWithPackages,
        totalWeight,
        unitNumbers: {
          flexo: flexoUnitNumber,
          wcut: wcutUnitNumber,
          dcut: dcutUnitNumber,
          opsert: opsertUnitNumber
        }
      });

    } catch (error) {
      console.error('Error getting packages by order ID:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { orderId, packageId } = req.params;
      const updateData = req.body;

      // Find the package document by order ID
      const pkg = await Package.findOne({
        order_id: orderId,
        'package_details._id': packageId
      });

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found for this order'
        });
      }

      // Find and update the specific package details
      const packageDetail = pkg.package_details.id(packageId);
      if (!packageDetail) {
        return res.status(404).json({
          success: false,
          message: 'Package ID not found in this order'
        });
      }

      // Update the package details
      Object.assign(packageDetail, updateData);

      // Save the updated document
      await pkg.save();

      res.json({
        success: true,
        data: pkg
      });
    } catch (error) {
      logger.error('Error updating package:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PackageController();