const DeliveryCommandService = require('../../services/delivery.service');
const DeliveryQueryService = require('../../services/delivery/query.service');
const { createDeliverySchema, updateDeliverySchema } = require('../../validators/delivery.validator');
const logger = require('../../utils/logger');

class DeliveryController {
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
        console.log('body data', req.body);
        try {
            const { error, value } = updateDeliverySchema.validate(req.body); // Validate request body
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                });
            }

            // The validated data is in 'value'
            console.log('status update', value);

            // Update the delivery with the provided ID and validated data
            const delivery = await DeliveryCommandService.update(req.params.id, value);

            if (!delivery) {
                return res.status(404).json({
                    success: false,
                    message: 'Delivery not found'
                });
            }

            // Return success response
            return res.json({
                success: true,
                message: 'Delivery updated successfully',
                data: delivery
            });
        } catch (error) {
            logger.error('Error updating delivery:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

       async list(req, res) {
        try {
            const {
                status,
                dateRange,
                customerName,
                sortBy,
                sortOrder,
                page,
                limit
            } = req.query;
            console.log('deliveryfsdfsfs', req.query);
            const result = await DeliveryQueryService.list({
                status,
                dateRange,
                customerName,
                sortBy,
                sortOrder,
                page,
                limit
            });
            console.log('result', result);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error listing deliveries:', error);
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

module.exports = new DeliveryController();