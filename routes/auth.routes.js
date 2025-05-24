const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const upload = require('../middleware/upload');

// Register route with file upload
router.post('/register',
  upload.single('profileImage'),
  AuthController.register.bind(AuthController)
);

// Login route
router.post('/login',
  AuthController.login.bind(AuthController)
);

module.exports = router;