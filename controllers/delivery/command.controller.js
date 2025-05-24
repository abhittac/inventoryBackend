const DeliveryCommandService = require('../../services/delivery/command.service');
const DeliveryQueryService = require('../../services/delivery/query.service');
const { createDeliverySchema, updateDeliverySchema } = require('../../validators/delivery.validator');
const logger = require('../../utils/logger');
const Delivery = require('../../models/Delivery');
const FinishedProduct = require('../../models/FinishedProduct');
const ProductionManager = require('../../models/ProductionManager');
const SalesOrder = require('../../models/SalesOrder');

const emailHelper = require("../helpers/emailHelper");
class DeliveryCommandController {
  async create(req, res) {

    console.log('request1', req);
    try {
      const { error, value } = createDeliverySchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      const delivery = await DeliveryCommandService.create(value);
      res.status(201).json({
        success: true,
        data: delivery
      });
    } catch (error) {
      logger.error('Error creating delivery:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req, res) {

    try {
      const { error, value } = updateDeliverySchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      // Fetch the existing delivery details from the database
      const existingDelivery = await Delivery.findById(req.params.id);
      console.log('param is', req.params.id);

      console.log('details is', existingDelivery);
      if (!existingDelivery) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found'
        });
      }

      console.log('details is', existingDelivery);
      // Check if required fields are available
      if (!existingDelivery.driverContact || !existingDelivery.driverName || !existingDelivery.vehicleNo) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update delivery. Driver contact, driver name, and vehicle number must be provided.'
        });
      }
      // Proceed with the update if all required fields exist
      const updatedDelivery = await Delivery.findOneAndUpdate(
        { _id: req.params.id }, // Find by ID
        { $set: value },
        { new: true }
      );

      // If status is "delivered", move to FinishProduct table
      if (updatedDelivery.status === 'delivered') {
        // Check if a FinishedProduct with the same orderId already exists
        const existingFinishedProduct = await FinishedProduct.findOne({ order_id: existingDelivery.orderId });

        if (!existingFinishedProduct) {
          // If no existing FinishedProduct, create a new one
          const newFinishProduct = new FinishedProduct({
            order_id: existingDelivery.orderId, // Copy order_id
            status: 'delivered',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await newFinishProduct.save(); // Save to FinishProduct table
        } else {
          console.log('Finished product already exists for this orderId');
        }

        const updatedProductionManager = await ProductionManager.findOneAndUpdate(
          { order_id: existingDelivery.orderId },
          {
            $set: {
              "production_details.progress": "Delivery Done",
              "status": "completed"
            }
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
        // Update status to "done" instead of deleting
        await Delivery.findByIdAndUpdate(req.params.id, { status: 'delivered' }, { new: true });

        // 6️⃣ Find and update status in Sales Order
        const salesRecord = await SalesOrder.findOne({ orderId: existingDelivery.orderId });

        console.log('salesRecord:', salesRecord);

        if (!salesRecord) {
          return res.status(404).json({ message: 'No sales record found for orderId' });
        }

        salesRecord.status = 'completed';
        await salesRecord.save();
        // 7️⃣ Send Invoice Email (Ensure it doesn’t block execution)
        try {
          const getDelivery = await Delivery.findById(req.params.id);
          await emailHelper.sendCompletedEmail(getDelivery, salesRecord);
          console.log("✅ Email Sent Successfully");
        } catch (emailError) {
          console.error("⚠️ Failed to send email:", emailError);
        }

      }

      res.json({
        success: true,
        message: 'Delivery updated successfully',
        data: updatedDelivery
      });
    } catch (error) {
      logger.error('Error updating delivery:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  async delete(req, res) {
    try {
      const delivery = await DeliveryCommandService.softDelete(req.params.id);

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found'
        });
      }

      res.json({
        success: true,
        message: 'Delivery deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting delivery:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DeliveryCommandController();