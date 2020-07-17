const express = require('express');
const router = express.Router();

const {
  getCart,
  createCart,
  updateCart,
  addItemToCart,
  updateItemInCart,
} = require('../controllers/carts');

router.route('/').post(createCart);
router.route('/:id').get(getCart).put(updateCart);
router.route('/:id/items').put(addItemToCart);
router.route('/:cartId/items/:itemId').put(updateItemInCart);

module.exports = router;
