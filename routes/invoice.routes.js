const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/invoice.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', InvoiceController.create.bind(InvoiceController));
router.get('/', InvoiceController.list.bind(InvoiceController));

module.exports = router;