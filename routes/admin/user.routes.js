const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/admin/user.controller');
const upload = require('../../middleware/upload');

// Update user with optional profile image
router.put('/:id',
  upload.single('profileImage'),
  UserController.updateUser.bind(UserController)
);


module.exports = router;