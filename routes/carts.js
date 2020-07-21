const express = require('express');
const router = express.Router();

const {
  getCart,
  createCart,
  updateCart,
  addItemToCart,
  updateItemInCart,
  deleteItemInCart,
} = require('../controllers/carts');

const { protect } = require('../middleware/auth');

//router.route('/').post(protect, createCart);
router
  .route('/:userId') /*.get(protect, getCart)*/
  .put(protect, updateCart);
router.route('/:userId/items').put(protect, addItemToCart);
router
  .route('/:userId/items/:itemId')
  .put(protect, updateItemInCart)
  .delete(protect, deleteItemInCart);

module.exports = router;
