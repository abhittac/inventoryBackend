const User = require('../models/User');
const logger = require('../utils/logger');

class AdminService {
  async updateUser(userId, updates) {
    // Remove sensitive fields
    const safeUpdates = { ...updates };
    delete safeUpdates.password;
    delete safeUpdates.email;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async validateUserExists(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = new AdminService();