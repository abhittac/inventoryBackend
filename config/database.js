const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://nidhikurmi11:kaMmPR7VMV1QESB7@cluster0.b5nllp5.mongodb.net/inventory';

    // Add connection options for better stability
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);
    logger.info('MongoDB Connected Successfully!');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logger.error(
        'MongoDB Connection Failed: Could not connect to MongoDB. Please make sure MongoDB is running.',
        error
      );
    } else {
      logger.error('MongoDB Connection Failed:', error);
    }

    // Instead of exiting immediately, we'll retry the connection
    logger.info('Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected! Attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);
});

module.exports = connectDB;