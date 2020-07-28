const User = require('../models/User');
const Order = require('../models/Order');
const ErrorResponse = require('../utils/ErrorResponse');

const asyncHandler = require('../middleware/async');

//@desc     Submit an order
//@route    POST /orders/:userId
//@access   Private
exports.submitOrder = asyncHandler(async (req, res, next) => {
  //Find user with corresponding user id
  let user = await User.findOne(
    { _id: req.params.userId, 'cart._id': req.body._id },
    { new: true }
  ).select('cart');

  //If unable to find user with incoming user id
  if (!user) {
    return next(
      new ErrorResponse(
        `Unable to place an order for user with id of ${req.params.userId}`,
        400
      )
    );
  }

  //Tag on order details to items array to create an order
  let orderRequest = { items: [...user.cart.items], ...req.body };

  //Create the new order in DB
  let order = await Order.create(orderRequest);

  if (!order) {
    return next(new ErrorResponse('Unable to create a new order', 400));
  }

  //If successfully created the new cart, then add its id to users order id array
  user = await User.findOneAndUpdate(
    { _id: req.params.userId },
    {
      $set: { cart: { items: [], quantity: 0 } },
      $push: {
        orders: { _id: order._id },
      },
    },
    { new: true, runValidators: true }
  );

  //Send back order that was successfully submitted
  res.status(200).json({ success: true, order: order });
});

//@desc     Get all orders for a user
//@route    GET /orders/:userId
//@access   Private
exports.getOrders = asyncHandler(async (req, res, next) => {
  //Get orders array for given user
  let user = await User.findOne(
    { _id: req.params.userId },
    {
      'cart.orders': 1,
    }
  ).select('orders');

  if (!user) {
    return next(
      new ErrorReponse(
        `Unable to get orders for user with id of ${req.params.userId}`
      )
    );
  }

  //Search for ids in orders array in the orders collection
  const orders = await Order.find({ _id: { $in: user.orders } });

  //Send back all orders for user
  res.status(200).json({ success: true, orders: orders });
});