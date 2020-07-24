const express = require('express');
const router = express.Router();

const { submitOrder, getOrders } = require('../controllers/orders');

const { protect } = require('../middleware/auth');

router.route('/:userId').get(protect, getOrders).post(protect, submitOrder);

module.exports = router;
