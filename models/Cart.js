const mongoose = require('mongoose');
const hash = require('object-hash');

const CartSchema = require('../schema/CartSchema');

CartSchema.post('save', function () {
  let cartQuantity = 0;
  this.items = this.items.map((item) => {
    cartQuantity += item.quantity;
    return { ...item, hash: [hash(item.pizza)] };
  });

  this.quantity = cartQuantity;
});

module.CartSchema = CartSchema;

module.exports = mongoose.model('Cart', CartSchema);
