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
  //Delivery address for order
  deliveryAddress: {
    streetAddress: {
      type: String,
      required: true,
    },
    secondaryAddress: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipcode: {
      type: String,
      required: true,
    },
  },
  //Ordered items
  items: [itemSchema],
};

module.exports = orderSchema;
