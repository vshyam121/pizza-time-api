const express = require('express');
const router = express.Router();

const { signUp, signIn, signOut, getMe } = require('../controllers/auth');

const { protect } = require('../middleware/auth');

router.post('/signup', signUp);
router.post('/signin', signIn);

//Check if user is already signed in
router.get('/me', protect, getMe);
router.post('/signout', protect, signOut);

module.exports = router;
