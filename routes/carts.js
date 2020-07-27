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

router.route('/:userId').put(protect, updateCart);
router.route('/:userId/items').post(protect, addItemsToCart);
router
  .route('/:userId/items/:itemId')
  .put(protect, updateItemInCart)
  .patch(protect, patchItemInCart)
  .delete(protect, deleteItemInCart);

module.exports = router;
