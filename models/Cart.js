const mongoose = require('mongoose');

const cartSchema = require('../schema/cartSchema');

//Minimize is false to keep empty hashmap object
const CartSchema = new mongoose.Schema(cartSchema, { minimize: false });

module.exports = mongoose.model('Cart', CartSchema);
