const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const hash = require('object-hash');

/*
//@desc     Get cart with id
//@route    GET /carts/:id
//@access   Private
exports.getCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findById(req.params.id);
  if (!cart) {
    return next(
      new ErrorResponse(`Cart not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(201).json({ success: true, data: cart });
});

//@desc     Get new cart
//@route    POST /carts
//@access   Private
exports.createCart = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const cart = await Cart.create(req.body);
  res.status(201).json({ success: true, data: cart });
});*/

//@desc     Update a cart with id
//@route    PUT /carts/:userId
//@access   Private
exports.updateCart = asyncHandler(async (req, res, next) => {
  //Need to update item hash map as well

  let incomingCart = req.body;
  //if update to cart has items, then associate hash with each of them
  //also calculate total cart quantity
  if (incomingCart.items.length > 0) {
    let itemsWithHashes = [];
    let totalQuantity = 0;

    //add hash to each item, calculate total quantity
    itemsWithHashes = incomingCart.items.map((item) => {
      totalQuantity += item.quantity;
      return { ...item, hash: hash(item.pizza) };
    });

    //add items with hashes and new cart quantity to updated cart
    incomingCart.items = itemsWithHashes;
    incomingCart.quantity = totalQuantity;
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.userId },
    { cart: incomingCart },
    {
      new: true,
      runValidators: true,
    }
  ).select('cart');
  if (!user) {
    return next(
      new ErrorResponse(
        `Cart not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }
  res.status(201).json({ success: true, data: user.cart });
});

//@desc     Add a new item to cart
//@route    PUT /carts/:userId/items
//@access   Private
exports.addItemToCart = asyncHandler(async (req, res, next) => {
  let item = req.body;
  item = { ...item, hash: hash(item.pizza) };

  //if hash of new item already exists, then update item quantity
  //and cart quantity
  let user = await User.findOneAndUpdate(
    {
      _id: req.params.userId,
      'cart.items.hash': hash(item.pizza),
    },
    {
      $inc: {
        'cart.items.$.quantity': item.quantity,
        'cart.quantity': item.quantity,
      },
    },
    { new: true }
  ).select('cart');

  //if hash of new item doesn't exist, then push to items array
  //and update total quantity
  if (!user) {
    user = await User.findOneAndUpdate(
      {
        _id: req.params.userId,
      },
      {
        $push: {
          'cart.items': {
            ...item,
          },
        },
        $inc: {
          'cart.quantity': item.quantity,
        },
      },
      { new: true }
    ).select('cart');
  }

  if (!user) {
    return next(
      new ErrorResponse(
        `Cart not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }
  res.status(201).json({ success: true, data: user.cart });
});

//@desc     Update an entire cart item
//@route    PUT /carts/:userId/items/:itemId
//@access   Private
exports.updateItemInCart = asyncHandler(async (req, res, next) => {
  let item = req.body;
  //Add hash to item
  item = { ...item, hash: hash(item.pizza) };

  //Find item with matching item id
  let user = await User.findOne(
    {
      _id: req.params.userId,
      'cart.items._id': req.params.itemId,
    },
    { 'cart.items.$': 1 }
  ).select('cart');

  console.log(user);
  if (!user || !user.cart.items) {
    return next(
      new ErrorResponse('Incorrect user id or item id provided', 404)
    );
  }

  const cart = user.cart;
  const matchingItemInCart = cart.items[0];
  //Update total cart quantity with new item quantity
  const oldItemQuantity = matchingItemInCart.quantity;
  let newCartQuantity = cart.quantity - oldItemQuantity;
  newCartQuantity += item.quantity;

  //If hashes match for incoming item and matching item id
  //then just update item quantity and total cart quantity
  if (matchingItemInCart.hash === hash(item.pizza)) {
    user = await User.findOneAndUpdate(
      { _id: req.params.userId, 'cart.items._id': req.params.itemId },
      {
        $set: {
          'cart.items.$.quantity': item.quantity,
          'cart.quantity': newCartQuantity,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('cart');
  }
  //If item id match has a hash that's different from incoming item hash
  //then see if hash matches another item and update accordingly.
  else {
    //First delete old item and update total cart quantity
    user = await User.findOneAndUpdate(
      {
        _id: req.params.userId,
      },
      {
        $set: {
          'cart.quantity': newCartQuantity,
        },
        $pull: {
          'cart.items': {
            _id: req.params.itemId,
          },
        },
      },
      { new: true, runValidators: true }
    ).select('cart');

    //See if hash matches another item, then increment that item's quantity
    user = await User.findOneAndUpdate(
      {
        _id: req.params.userId,
        'cart.items.hash': hash(item.pizza),
      },
      {
        $inc: {
          'cart.items.$.quantity': item.quantity,
        },
      },
      { new: true, runValidators: true }
    ).select('cart');

    //If hash doesn't match another item, create a new item
    if (!user) {
      user = await User.findOneAndUpdate(
        {
          _id: req.params.userId,
        },
        {
          $push: {
            'cart.items': {
              ...item,
            },
          },
        },
        { new: true, runValidators: true }
      ).select('cart');
    }
  }

  if (!user) {
    return next(
      new ErrorResponse(`Cart not found with id of ${req.params.cartId}`, 404)
    );
  }
  res.status(201).json({ success: true, data: user.cart });
});

//@desc     Delete an item in cart
//@route    DELETE /carts/:userId/items/:itemId
//@access   Private
exports.deleteItemInCart = asyncHandler(async (req, res, next) => {
  //Find item with matching item id
  let user = await User.findOne(
    {
      _id: req.params.userId,
      'cart.items._id': req.params.itemId,
    },
    { 'cart.items.$': 1 }
  ).select('cart');

  if (!user) {
    return next(
      new ErrorResponse('Incorrect cart id or item id provided', 404)
    );
  }

  const toBeDeletedItemQuantity = user.cart.items[0].quantity;
  user = await User.findOneAndUpdate(
    { _id: req.params.userId, 'cart.items._id': req.params.itemId },
    {
      $pull: {
        'cart.items': { _id: req.params.itemId },
      },
      $inc: { 'cart.quantity': -toBeDeletedItemQuantity },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select('cart');

  if (!user) {
    return next(
      new ErrorResponse(
        `Cart not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }
  res.status(201).json({ success: true, data: user.cart });
});
