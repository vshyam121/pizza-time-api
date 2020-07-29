const mongoose = require('mongoose');
const hash = require('object-hash');

const orderSchema = require('../schema/orderSchema');

const OrderSchema = new mongoose.Schema(orderSchema);

module.exports = mongoose.model('Order', OrderSchema);
