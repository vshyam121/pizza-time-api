const mongoose = require('mongoose');
const itemSchema = require('./itemSchema');

const cartSchema = {
  //Array of cart items
  items: [itemSchema],
  //Hashes of pizza attributes to index in items array
  pizzaHashMap: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {},
  },
  //Cart quantity
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
};

module.exports = cartSchema;
