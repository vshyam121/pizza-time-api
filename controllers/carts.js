const Cart = require('../models/Cart');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const hash = require('object-hash');
const { generatePizzaHashMap } = require('../utils/utils');

//@desc Create a cart for user in provided token
//@route POST /carts
//@access Private
exports.createCart = asyncHandler(async (req, res, next) => {
  //Get user from user id
  let user = await User.findOne({ _id: req.user._id });

  if (!user) {
    return next(new ErrorResponse('Unable to find user', 400));
  }

  //Create an empty cart
  const cart = await Cart.create({});

  if (!cart) {
    return next(new ErrorResponse('Unable to create cart', 500));
  }

  //Update user with id of newly created cart
  user = await User.findOneAndUpdate({ _id: req.user._id }, { cart: cart._id });

  if (!user) {
    return next(new ErrorResponse('Unable to create cart for user', 500));
  }

  //Send new cart back
  res.status(201).json({ success: true, cart: cart });
});

//@desc Get cart for user in provided token
//@route GET /carts
//@access Private
exports.getCart = asyncHandler(async (req, res, next) => {
  //Find the user by id
  let user = await User.findOne(
    { _id: req.user._id },
    { cart: 1 },
    { new: true }
  );

  if (!user) {
    return next(new ErrorResponse('Unable to find user', 400));
  }

  //Find the cart using the cart id in user
  const cart = await Cart.findOne({ _id: user.cart });

  //Send cart back
  res.status(200).json({ success: true, cart: cart });
});

//@desc     Update a cart with id
//@route    PUT /carts/:cartId
//@access   Private
exports.updateCart = asyncHandler(async (req, res, next) => {
  let incomingCart = req.body;

  //Pizza hash to index in items array
  let pizzaHashMap = {};

  //Will contain items deduped by pizza attributes
  let dedupedItems = [];

  //Number of items in cart
  let cartQuantity = 0;

  //Make sure incoming items are deduped on items containing same pizza
  //Construct pizza hashmap and get cart quantity
  incomingCart.items.forEach((item) => {
    //Get hash of incoming pizza
    let pizzaHash = hash(item.pizza);

    //If pizza already in hashmap, then just update the quantity
    if (pizzaHash in pizzaHashMap) {
      dedupedItems[pizzaHashMap[pizzaHash]].quantity += item.quantity;
    }
    //Otherwise add to hash map and add item to deduped items
    else {
      pizzaHashMap[pizzaHash] = dedupedItems.length;
      dedupedItems.push(item);
    }

    //Add item's quantity to overall cart quantity
    cartQuantity += item.quantity;
  });

  //Set items to deduped items
  incomingCart.items = dedupedItems;

  //Set constructed pizza hash map
  incomingCart.pizzaHashMap = pizzaHashMap;

  //Set total cart quantity
  incomingCart.quantity = cartQuantity;

  //Update cart for user id with deduped items
  //pizza hash map and cart quantity
  const cart = await Cart.findOneAndUpdate(
    { _id: req.params.cartId },
    {
      $set: {
        items: incomingCart.items,
        pizzaHashMap: incomingCart.pizzaHashMap,
        quantity: incomingCart.quantity,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  //Send 200 response with cart contents
  res.status(200).json({ success: true, data: cart });
});

//@desc     Add a new item to cart
//@route    POST /carts/:cartId/items
//@access   Private
exports.addItemsToCart = asyncHandler(async (req, res, next) => {
  let items = req.body;

  //Get user's cart
  let cart = await Cart.findOne({
    _id: req.params.cartId,
  }).lean();

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 400));
  }

  let currentItems = cart.items;
  let pizzaHashMap = cart.pizzaHashMap;
  let cartQuantity = cart.quantity;

  for (let item of items) {
    //If matching item index found in pizza hash map, then update quantity for that cart item
    let pizzaHash = hash(item.pizza);
    if (pizzaHash in pizzaHashMap) {
      let matchingItemIndex = pizzaHashMap[pizzaHash];
      currentItems[matchingItemIndex].quantity += item.quantity;
    }
    //Otherwise, push item to items array
    else {
      //Delete id if coming from local cart
      delete item['_id'];

      //Add to items array
      currentItems.push(item);

      //Set pizza hash to point to index of added item
      pizzaHashMap[pizzaHash] = currentItems.length - 1;
    }

    //Update cart quantity with quantity of item
    cartQuantity += item.quantity;
  }

  //Update cart with new items array
  //hash map and quantity
  cart = await Cart.findOneAndUpdate(
    {
      _id: req.params.cartId,
    },
    {
      items: currentItems,
      pizzaHashMap: pizzaHashMap,
      quantity: cartQuantity,
    },
    { new: true, runValidators: true }
  );

  if (!cart) {
    return next(new ErrorResponse('Unable to add item(s) to cart', 500));
  }
  res.status(200).json({ success: true, cart: cart });
});

//@desc Helper function for updating items array with a new item
const updateItemsHelper = (
  incomingItem,
  pizzaHashMap,
  cartQuantity,
  currentItems,
  itemId
) => {
  //Hash of incoming item
  let incomingPizzaHash = hash(incomingItem.pizza);

  //Get index of matching item id in items array
  let matchingItemIdIndex = currentItems.findIndex(
    (item) => item._id == itemId
  );

  //Update cart quantity
  cartQuantity -= currentItems[matchingItemIdIndex].quantity;
  cartQuantity += incomingItem.quantity;

  //If matching item index found in pizza hash map, then update quantity for that cart item
  if (incomingPizzaHash in pizzaHashMap) {
    //Get index of item with matching hash in items array
    let matchingPizzaIndex = pizzaHashMap[incomingPizzaHash];

    //If matching hash item's id does not matching incoming item id,
    //then update quantity of matching item and remove traces of the old item
    if (currentItems[matchingPizzaIndex]._id != itemId) {
      //Add to quantity of matching item
      currentItems[matchingPizzaIndex].quantity += incomingItem.quantity;

      //Remove old item from currentItems array
      currentItems.splice(matchingItemIdIndex, 1);

      //Need to regenerate pizza hashmap
      pizzaHashMap = generatePizzaHashMap(currentItems);
    }
    //Otherwise, replace the quantity of matching item
    else {
      currentItems[matchingPizzaIndex].quantity = incomingItem.quantity;
    }
  }
  //If matching item index not found in hash map, replace item in item array
  else {
    //Remove old item's pizza hash
    let oldPizzaHash = hash(currentItems[matchingItemIdIndex].pizza);
    delete pizzaHashMap[oldPizzaHash];

    //Put in new hash in hash map pointing to same index
    pizzaHashMap[incomingPizzaHash] = matchingItemIdIndex;

    //Relace with new item in item array
    incomingItem = { _id: itemId, ...incomingItem };
    currentItems.splice(matchingItemIdIndex, 1, incomingItem);
  }

  return [cartQuantity, pizzaHashMap];
};

//@desc     Patch part of a cart item
//@route    PATCH /carts/:cartId/items/:itemId
//@access   Private
exports.patchItemInCart = asyncHandler(async (req, res, next) => {
  let partialItem = req.body;

  //Get user's cart
  let cart = await Cart.findOne({
    _id: req.params.cartId,
    'items._id': req.params.itemId,
  }).lean();

  if (!cart) {
    return next(new ErrorResponse('Cart or item not found', 400));
  }

  let currentItems = cart.items;
  let pizzaHashMap = cart.pizzaHashMap;
  let cartQuantity = cart.quantity;

  //Get index of item with item id that is being changed
  let matchingItemIdIndex = currentItems.findIndex(
    (currentItem) => currentItem._id == req.params.itemId
  );

  //Update part of the item with corresponding item id
  let currentItem = currentItems[matchingItemIdIndex];
  currentItem = { ...currentItem, ...req.body };

  //Make sure to update pizza hashmap and quantity
  //based on updated item
  [cartQuantity, pizzaHashMap] = updateItemsHelper(
    currentItem,
    pizzaHashMap,
    cartQuantity,
    currentItems,
    req.params.itemId
  );

  //Update cart with new items array
  //and corresponding bookkeeping data
  cart = await Cart.findOneAndUpdate(
    {
      _id: req.params.cartId,
    },
    {
      items: currentItems,
      pizzaHashMap: pizzaHashMap,
      quantity: cartQuantity,
    },
    { new: true, runValidators: true }
  );

  if (!cart) {
    return next(new ErrorResponse('Unable to patch item to cart', 500));
  }

  //Send back updated cart
  res.status(200).json({ success: true, cart: cart });
});

//@desc     Update an entire cart item
//@route    PUT /carts/:cartId/items/:itemId
//@access   Private
exports.updateItemInCart = asyncHandler(async (req, res, next) => {
  let incomingItem = req.body;

  //Get user's cart
  let cart = await Cart.findOne({
    _id: req.params.cartId,
    'items._id': req.params.itemId,
  }).lean();

  if (!cart) {
    return next(new ErrorResponse('Cart or item not found', 400));
  }

  let currentItems = cart.items;
  let pizzaHashMap = cart.pizzaHashMap;
  let cartQuantity = cart.quantity;

  //Update items array with incoming item and get back
  //new cart quantity and hash map
  [cartQuantity, pizzaHashMap] = updateItemsHelper(
    incomingItem,
    pizzaHashMap,
    cartQuantity,
    currentItems,
    req.params.itemId
  );

  //Update cart with new items array
  cart = await Cart.findOneAndUpdate(
    {
      _id: req.params.cartId,
    },
    {
      items: currentItems,
      pizzaHashMap: pizzaHashMap,
      quantity: cartQuantity,
    },
    { new: true, runValidators: true }
  );

  if (!cart) {
    return next(new ErrorResponse('Unable to update item', 500));
  }

  //Send back updated cart
  res.status(200).json({ success: true, cart: cart });
});

//@desc     Delete an item in cart
//@route    DELETE /carts/:cartId/items/:itemId
//@access   Private
exports.deleteItemInCart = asyncHandler(async (req, res, next) => {
  //Get user's cart
  let cart = await Cart.findOne({
    _id: req.params.cartId,
    'items._id': req.params.itemId,
  }).lean();

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 400));
  }

  let currentItems = cart.items;
  let cartQuantity = cart.quantity;
  //Filter out item id that needs to be deleted
  let matchingItemIdIndex = currentItems.findIndex(
    (item) => item._id == req.params.itemId
  );

  //Subtract item's quantity from total cart quantity
  cartQuantity -= currentItems[matchingItemIdIndex].quantity;

  //Remove item from items array
  currentItems.splice(matchingItemIdIndex, 1);

  //Generate hash map
  let pizzaHashMap = generatePizzaHashMap(currentItems);

  //Update cart with new items array
  cart = await Cart.findOneAndUpdate(
    {
      _id: req.params.cartId,
    },
    {
      items: currentItems,
      pizzaHashMap: pizzaHashMap,
      quantity: cartQuantity,
    },
    { new: true, runValidators: true }
  );

  if (!cart) {
    return next(new ErrorResponse('Unable to delete item', 500));
  }

  //Send back updated cart
  res.status(200).json({ success: true, cart: cart });
});
