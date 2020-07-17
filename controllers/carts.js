const Cart = require('../models/Cart');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const hash = require('object-hash');

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
});

//@desc     Update a cart with id
//@route    PUT /carts/:id
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

  const cart = await Cart.findOneAndUpdate(
    { _id: req.params.id },
    incomingCart,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!cart) {
    return next(
      new ErrorResponse(`Cart not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(201).json({ success: true, data: cart });
});

//@desc     Add a new item to cart
//@route    PUT /carts/:id/items
//@access   Private
exports.addItemToCart = asyncHandler(async (req, res, next) => {
  let item = req.body;
  item = { ...item, hash: hash(item.pizza) };

  //if hash of new item already exists, then update item quantity
  //and cart quantity
  let cart = await Cart.findOneAndUpdate(
    {
      _id: req.params.id,
      'items.hash': hash(item.pizza),
    },
    {
      $inc: {
        'items.$.quantity': item.quantity,
        quantity: item.quantity,
      },
    },
    { new: true }
  );

  //if hash of new item doesn't exist, then push to items array
  //and update total quantity
  if (!cart) {
    cart = await Cart.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      {
        $push: {
          items: {
            ...item,
          },
        },
        $inc: {
          quantity: item.quantity,
        },
      },
      { new: true }
    );
  }

  if (!cart) {
    return next(
      new ErrorResponse(`Cart not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(201).json({ success: true, data: cart });
});

//@desc     Update an entire cart item
//@route    PUT /carts/:cartId/items/:itemId
//@access   Private
exports.updateItemInCart = asyncHandler(async (req, res, next) => {
  let item = req.body;
  //Add hash to item
  item = { ...item, hash: hash(item.pizza) };

  //Find item with matching item id
  let cart = await Cart.findOne(
    {
      _id: req.params.cartId,
      'items._id': req.params.itemId,
    },
    {
      items: { $elemMatch: { _id: req.params.itemId } },
      quantity: 1,
    }
  );
  if (!cart) {
    return next(
      new ErrorResponse('Incorrect cart id or item id provided', 404)
    );
  }

  //Update total cart quantity with new item quantity
  const oldItemQuantity = cart.items[0].quantity;
  let newCartQuantity = cart.quantity - oldItemQuantity;
  newCartQuantity += item.quantity;

  //If hashes match for incoming item and matching item id
  //then just update item quantity and total cart quantity
  if (cart.items[0].hash === hash(item.pizza)) {
    cart = await Cart.findOneAndUpdate(
      { _id: req.params.cartId, 'items._id': req.params.itemId },
      {
        $set: { 'items.$.quantity': item.quantity, quantity: newCartQuantity },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }
  //If item id match has a hash that's different from incoming item hash
  //then see if hash matches another item and update accordingly.
  else {
    //First delete old item and update total cart quantity
    cart = await Cart.findOneAndUpdate(
      {
        _id: req.params.cartId,
      },
      {
        $set: {
          quantity: newCartQuantity,
        },
        $pull: {
          items: {
            _id: req.params.itemId,
          },
        },
      },
      { new: true, runValidators: true }
    );

    //See if hash matches another item, then increment that item's quantity
    cart = await Cart.findOneAndUpdate(
      {
        _id: req.params.cartId,
        'items.hash': hash(item.pizza),
      },
      {
        $inc: {
          'items.$.quantity': item.quantity,
        },
      },
      { new: true, runValidators: true }
    );

    //If hash doesn't match another item, create a new item
    if (!cart) {
      cart = await Cart.findOneAndUpdate(
        {
          _id: req.params.cartId,
        },
        {
          $push: {
            items: {
              ...item,
            },
          },
        },
        { new: true, runValidators: true }
      );
    }
  }

  if (!cart) {
    return next(
      new ErrorResponse(`Cart not found with id of ${req.params.cartId}`, 404)
    );
  }
  res.status(201).json({ success: true, data: cart });
});

//@desc     Delete an item in cart
//@route    DELETE /carts/:cartId/items/:itemId
//@access   Private
exports.deleteItemInCart = asyncHandler(async (req, res, next) => {
  //delete item in items array using item id
  //delete item hash from item hash map
  //return success: true and data null
  console.log(req.body);
  const cart = await Cart.findOneAndUpdate(
    { _id: req.params.cartId, 'items._id': req.params.itemId },
    {
      $pull: {
        items: { _id: req.params.itemId },
        $inc: { quantity: 'items.$.quantity' },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!cart) {
    return next(
      new ErrorResponse(`Cart not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(201).json({ success: true, data: cart });
});
