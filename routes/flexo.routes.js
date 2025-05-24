const express = require('express');
const router = express.Router();
const FlexoController = require('../controllers/flexo.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Flexo routes
router.get('/', FlexoController.list.bind(FlexoController));
router.get('/report', FlexoController.getReport.bind(FlexoController));
router.put('/:id', FlexoController.update.bind(FlexoController));

module.exports = router;