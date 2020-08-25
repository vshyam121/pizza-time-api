const express = require('express');
const router = express.Router();

const { signUp, signIn, getMe } = require('../controllers/auth');

const { protect } = require('../middleware/auth');

router.post('/signup', signUp);
router.post('/signin', signIn);
router.get('/me', protect, getMe);

module.exports = router;
