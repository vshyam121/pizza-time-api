const itemSchema = require('./itemSchema');

const orderSchema = {
  //Total cost of order
  total: {
    type: String,
    required: true,
  },
  //Date when order was made
  orderDate: {
    type: Date,
    required: true,
  },
  //Ordered items
  items: [itemSchema],
};

module.exports = orderSchema;
