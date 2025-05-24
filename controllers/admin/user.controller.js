const AdminService = require('../../services/admin.service');
const { updateUserSchema } = require('../../validators/admin.validator');
const logger = require('../../utils/logger');

class UserController {
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      
      // Validate input
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      // Check if user exists
      await AdminService.validateUserExists(id);

      // Update user profile image if provided
      if (req.file) {
        value.profileImage = req.file.path;
      }

      // Update user
      const updatedUser = await AdminService.updateUser(id, value);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(error.message === 'User not found' ? 404 : 400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new UserController();