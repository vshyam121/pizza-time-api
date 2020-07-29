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
    type: {
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
    required: false,
  },
  //Items that are being ordered
  items: [itemSchema],
};

module.exports = orderSchema;
