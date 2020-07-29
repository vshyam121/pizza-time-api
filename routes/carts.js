const express = require('express');
const router = express.Router();

const {
  getCart,
  createCart,
  updateCart,
  addItemsToCart,
  updateItemInCart,
  patchItemInCart,
  deleteItemInCart,
} = require('../controllers/carts');

const { protect } = require('../middleware/auth');

router.route('/').get(protect, getCart).post(protect, createCart);
router.route('/:cartId').put(protect, updateCart);
router.route('/:cartId/items').post(protect, addItemsToCart);
router
  .route('/:cartId/items/:itemId')
  .put(protect, updateItemInCart)
  .patch(protect, patchItemInCart)
  .delete(protect, deleteItemInCart);

module.exports = router;
