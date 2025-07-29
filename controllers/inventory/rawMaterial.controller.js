const RawMaterial = require("../../models/RawMaterial");
const logger = require("../../utils/logger");
const SalesOrder = require("../../models/SalesOrder");
const { default: mongoose } = require("mongoose");
const SubCategory = require("../../models/schemas/subCategorySchema");
const Subcategory = require("../../models/subcategory");
const Delivery = require("../../models/Delivery");
const User = require("../../models/User");
const ProductionManager = require("../../models/ProductionManager");

class RawMaterialController {
  async create(req, res) {
    try {
      const user = req.user;


      // Destructure request body to extract raw material details
      const {
        category_name,
        fabric_quality,
        roll_size,
        gsm,
        fabric_color,
        quantity_kgs,
      } = req.body;

      // Validate required fields
      if (
        !category_name ||
        !fabric_quality ||
        !roll_size ||
        !gsm ||
        !fabric_color
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required.",
        });
      }

      const fabric_color_lower = fabric_color.toLowerCase();
      const fabric_quality_lower = fabric_quality.toLowerCase();
      const quantity = quantity_kgs ? Number(quantity_kgs) : 0;
      console.log('fabric_color_lower', fabric_color_lower);
      console.log('fabric_quality_lower', fabric_quality_lower);
      console.log('quantity', quantity);


      // Check for duplicate entry
      const existingMaterial = await RawMaterial.findOne({
        category_name,
        fabric_quality: fabric_quality_lower,
        roll_size,
        gsm,
        fabric_color: fabric_color_lower,
      });

      if (existingMaterial) {
        return res.status(409).json({
          success: false,
          message: "Duplicate entry: This raw material already exists.",
        });
      }


      // Create new raw material instance
      const rawMaterial = await RawMaterial.create({
        category_name,
        fabric_quality: fabric_quality_lower,
        roll_size,
        gsm,
        fabric_color: fabric_color_lower,
        quantity,
      });

      // if (!mongoose.Types.ObjectId.isValid(user._id)) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Invalid user ID.",
      //   });
      // }

      // const updatedSalesOrder = await SalesOrder.findOneAndUpdate(
      //   { userId: user._id },
      //   {
      //     $push: { category: rawMaterial._id },
      //   },
      //   { new: true }
      // ).populate("category");

      // if (!updatedSalesOrder) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Sales order not found for this user.",
      //   });
      // }

      res.status(201).json({
        success: true,
        data: rawMaterial,
      });
    } catch (error) {
      logger.error("Error creating raw material:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: error.errors, // Detailed validation errors
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  }

  async createSubCategory(req, res) {
    console.log('req.body', req.body);

    try {
      // Destructure request body
      let { fabricColor, rollSize, gsm, fabricQuality, quantity, category } = req.body;

      // Convert rollSize, gsm, and quantity to numbers
      rollSize = Number(rollSize);
      gsm = Number(gsm);
      quantity = Number(quantity);
      fabricColor = fabricColor.toLowerCase();
      fabricQuality = fabricQuality.toLowerCase();

      // Validate required fields
      if (!fabricColor || isNaN(rollSize) || isNaN(gsm) || !fabricQuality || isNaN(quantity) || !category) {
        return res.status(400).json({
          success: false,
          message: "All fields are required and must be valid numbers.",
        });
      }

      // Validate category ID format
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      // Fetch RawMaterial data
      const rawMaterial = await RawMaterial.findById(category);
      if (!rawMaterial) {
        return res.status(404).json({
          success: false,
          message: "Parent category (RawMaterial) not found.",
        });
      }

      console.log('RawMaterial before update:', rawMaterial);
      // return false;
      // Check if stock is sufficient before subtraction
      // if (
      //   rawMaterial.quantity_kgs < quantity
      // ) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Insufficient stock in inventory. Unable to add subcategory due to low raw material availability.",
      //   });
      // }
      // Create the subcategory
      const subCategory = await SubCategory.create({
        fabricColor,
        rollSize,
        gsm,
        fabricQuality,
        quantity,
        category,
      });

      // Subtract values from RawMaterial
      rawMaterial.quantity_kgs = Number(rawMaterial.quantity_kgs) || 0;
      rawMaterial.quantity_kgs += quantity;

      // Save updated RawMaterial
      await rawMaterial.save();

      res.status(201).json({
        success: true,
        message: "Subcategory added successfully and inventory updated.",
        data: subCategory,
        updatedRawMaterial: rawMaterial,
      });

    } catch (error) {
      console.error("Error adding subcategory:", error);
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  }


  async list(req, res) {
    try {
      const materials = await RawMaterial.find().sort({ _id: -1 });

      const materialsWithTotal = await Promise.all(
        materials.map(async (material) => {
          // Find subcategories where `category` equals the material _id
          const subCategories = await Subcategory.find({
            category: material._id,
            status: "active" // optional: only include active subcategories
          });

          const totalSubcategoryQuantity = subCategories.reduce((sum, sub) => {
            return sum + (sub.quantity || 0);
          }, 0);

          return {
            ...material._doc,
            totalSubcategoryQuantity,
            subCategories, // include subcategory list if needed
          };
        })
      );

      res.json({
        success: true,
        data: materialsWithTotal,
      });
    } catch (error) {
      logger.error("Error listing raw materials:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }


  async getSubcategories(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate Category ID
      const category = await RawMaterial.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Fetch Subcategories linked to this Category
      const subCategories = await SubCategory.find({
        category: categoryId,
        status: 'active'
      }).populate("category");

      res.status(200).json({
        success: true,
        data: subCategories,
      });
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  }

  async update(req, res) {
    try {
      const material = await RawMaterial.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!material) {
        return res.status(404).json({
          success: false,
          message: "Raw material not found",
        });
      }

      res.json({
        success: true,
        data: material,
      });
    } catch (error) {
      logger.error("Error updating raw material:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteMaterial(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid material ID.",
        });
      }


      // Step 2: Find the raw material
    const material = await RawMaterial.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found.",
      });
    }
    console.log(`Deleted raw material with ID: ${material._id}`);


    // Step 3: Delete all subcategories related to this raw material's category
    const deletedSubcategories = await Subcategory.deleteMany({
      category: material._id,
    });

    console.log(`Deleted ${deletedSubcategories.deletedCount} subcategories`);
    // return false;
    
    // Step 4: Now delete the raw material
    await RawMaterial.findByIdAndDelete(id);

       return res.json({
      success: true,
      message: "Raw material and related subcategories deleted successfully.",
      deletedSubcategoriesCount: deletedSubcategories.deletedCount,
      data: material,
    });
    } catch (error) {
      logger.error("Error deleting raw material:", error);

      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  }

  async deleteSubCategory(req, res) {
    try {
      const { id } = req.params;
      console.log("Subcategory ID received:", id);

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subcategory ID format.",
        });
      }


      // Find and delete the subcategory
      const subcategory = await Subcategory.findById(id);
      console.log('subcategory', subcategory);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: "Subcategory not found or already deleted.",
        });
      }

      // Step 2: Find the related raw material
      const rawMaterial = await RawMaterial.findById(subcategory.category);
      if (!rawMaterial) {
        return res.status(404).json({
          success: false,
          message: "Parent category (RawMaterial) not found.",
        });
      }

      // Step 3: Add subcategory quantity back to raw material
      rawMaterial.quantity_kgs -= subcategory.quantity;
      await rawMaterial.save();

      // Step 4: Now delete the subcategory
      await Subcategory.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Subcategory deleted successfully.",
        deletedSubcategory: subcategory,
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error); // Use console.error for better debugging
      logger.error("Error deleting subcategory:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
    }
  }

  async recentActivities(req, res) {
    try {
      const latestSalesOrder = await SalesOrder.findOne().sort({ createdAt: -1 });
      const latestDelivery = await Delivery.findOne().sort({ createdAt: -1 });
      const latestUser = await User.findOne().sort({ createdAt: -1 });
      const latestProductionTask = await ProductionManager.findOne().sort({ createdAt: -1 });

      const activities = [];

      if (latestSalesOrder) {
        activities.push({
          id: latestSalesOrder._id,
          type: "order",
          text: `New order #${latestSalesOrder.orderId} received`,
          time: latestSalesOrder.createdAt,
        });
      }

      if (latestDelivery) {
        activities.push({
          id: latestDelivery._id,
          type: "delivery",
          text: `Order #${latestDelivery.orderId} has been delivered`,
          time: latestDelivery.createdAt,
        });
      }

      if (latestUser) {
        activities.push({
          id: latestUser._id,
          type: "user",
          text: `New user ${latestUser.fullName} registered`,
          time: latestUser.createdAt,
        });
      }

      if (latestProductionTask) {
        activities.push({
          id: latestProductionTask._id,
          type: "task",
          text: `Production task ${latestProductionTask.order_id} completed`,
          time: latestProductionTask.createdAt,
        });
      }

      return res.status(200).json({
        success: true,
        data: activities.sort((a, b) => new Date(b.time) - new Date(a.time)), // Sort by latest timestamp
      });

    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching recent activities",
      });
    }
  }
}

module.exports = new RawMaterialController();
