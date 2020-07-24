const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const hash = require('object-hash');
const { generatePizzaHashMap } = require('../utils/utils');

//@desc     Update a cart with id
//@route    PUT /carts/:userId
//@access   Private
exports.updateCart = asyncHandler(async (req, res, next) => {
  let incomingCart = req.body;

  let pizzaHashMap = {};
  let dedupedItems = [];
  let cartQuantity = 0;

  //Make sure incoming items are deduped on items containing same pizza
  //Construct pizza hashmap and get cart quantity
  incomingCart.items.forEach((item) => {
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
  res.status(200).json({ success: true, data: user.cart });
});

//@desc     Add a new item to cart
//@route    POST /carts/:userId/items
//@access   Private
exports.addItemsToCart = asyncHandler(async (req, res, next) => {
  let items = req.body;

  //Get user's cart
  let user = await User.findOne(
    {
      _id: req.params.userId,
    },
    {
      cart: 1,
    },
    { new: true }
  ).lean();

  if (!user) {
    return next(
      new ErrorResponse(
        `Cart not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }

  let currentItems = user.cart.items;
  let pizzaHashMap = user.cart.pizzaHashMap;
  let cartQuantity = user.cart.quantity;

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
  user = await User.findOneAndUpdate(
    {
      _id: req.params.userId,
    },
    {
      'cart.items': currentItems,
      'cart.pizzaHashMap': pizzaHashMap,
      'cart.quantity': cartQuantity,
    },
    { new: true, runValidators: true }
  )
    .select('cart.items')
    .select('cart.quantity');

  if (!user) {
    return next(
      new ErrorResponse(
        `Cart not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }
  res.status(200).json({ success: true, cart: user.cart });
});

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
//@route    PATCH /carts/:userId/items/:itemId
//@access   Private
exports.patchItemInCart = asyncHandler(async (req, res, next) => {
  let partialItem = req.body;

  //Get user's cart
  let user = await User.findOne(
    {
      _id: req.params.userId,
      'cart.items._id': req.params.itemId,
    },
    {
      cart: 1,
    },
    { new: true }
  ).lean();

  if (!user) {
    return next(
      new ErrorResponse(
        `Cart or item not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }

  let currentItems = user.cart.items;
  let pizzaHashMap = user.cart.pizzaHashMap;
  let cartQuantity = user.cart.quantity;

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
  user = await User.findOneAndUpdate(
    {
      _id: req.params.userId,
    },
    {
      'cart.items': currentItems,
      'cart.pizzaHashMap': pizzaHashMap,
      'cart.quantity': cartQuantity,
    },
    { new: true, runValidators: true }
  )
    .select('cart.items')
    .select('cart.quantity');

  res.status(200).json({ success: true, cart: user.cart });
});

//@desc     Update an entire cart item
//@route    PUT /carts/:userId/items/:itemId
//@access   Private
exports.updateItemInCart = asyncHandler(async (req, res, next) => {
  let incomingItem = req.body;

  //Get user's cart
  let user = await User.findOne(
    {
      _id: req.params.userId,
      'cart.items._id': req.params.itemId,
    },
    {
      cart: 1,
    },
    { new: true }
  ).lean();

  if (!user) {
    return next(
      new ErrorResponse(
        `Cart or item not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }

  let currentItems = user.cart.items;
  let pizzaHashMap = user.cart.pizzaHashMap;
  let cartQuantity = user.cart.quantity;

  [cartQuantity, pizzaHashMap] = updateItemsHelper(
    incomingItem,
    pizzaHashMap,
    cartQuantity,
    currentItems,
    req.params.itemId
  );

  //Update cart with new items array
  user = await User.findOneAndUpdate(
    {
      _id: req.params.userId,
    },
    {
      'cart.items': currentItems,
      'cart.pizzaHashMap': pizzaHashMap,
      'cart.quantity': cartQuantity,
    },
    { new: true, runValidators: true }
  )
    .select('cart.items')
    .select('cart.quantity');

  res.status(200).json({ success: true, cart: user.cart });
});

//@desc     Delete an item in cart
//@route    DELETE /carts/:userId/items/:itemId
//@access   Private
exports.deleteItemInCart = asyncHandler(async (req, res, next) => {
  //Get user's cart
  let user = await User.findOne(
    {
      _id: req.params.userId,
      'cart.items._id': req.params.itemId,
    },
    {
      cart: 1,
    },
    { new: true }
  ).lean();

  if (!user) {
    return next(
      new ErrorResponse(
        `Cart or item not found for user with id of ${req.params.userId}`,
        404
      )
    );
  }

  let currentItems = user.cart.items;
  let cartQuantity = user.cart.quantity;
  //Filter out item id that needs to be deleted
  let matchingItemIdIndex = currentItems.findIndex(
    (item) => item._id == req.params.itemId
  );

  cartQuantity -= currentItems[matchingItemIdIndex].quantity;
  currentItems.splice(matchingItemIdIndex, 1);

  let pizzaHashMap = generatePizzaHashMap(currentItems);

  //Update cart with new items array
  user = await User.findOneAndUpdate(
    {
      _id: req.params.userId,
    },
    {
      'cart.items': currentItems,
      'cart.pizzaHashMap': pizzaHashMap,
      'cart.quantity': cartQuantity,
    },
    { new: true, runValidators: true }
  )
    .select('cart.items')
    .select('cart.quantity');

  res.status(200).json({ success: true, cart: user.cart });
});
