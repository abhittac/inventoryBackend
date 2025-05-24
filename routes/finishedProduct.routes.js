const express = require('express');
const router = express.Router();
const FinishedProductController = require('../controllers/finishedProduct.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', FinishedProductController.create.bind(FinishedProductController));
router.get('/', FinishedProductController.list.bind(FinishedProductController));

module.exports = router;