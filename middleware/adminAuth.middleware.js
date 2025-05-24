const AuthUtils = require('../utils/auth.utils');
const User = require('../models/User');
const { REGISTRATION_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = AuthUtils.verifyToken(token);
    const user = await User.findOne({ 
      _id: decoded.userId,
      registrationType: REGISTRATION_TYPES.ADMIN,
      status: 'active'
    });

    if (!user) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(401).json({ message: 'Please authenticate as admin' });
  }
};

module.exports = adminAuthMiddleware;