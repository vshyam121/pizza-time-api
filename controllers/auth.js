const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const jwt = require('jsonwebtoken');

//@desc     Register user
//@route    POST /auth/register
//@access   Public
exports.signUp = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Create user
  const user = await User.create({
    email,
    password,
  });

  sendTokenResponse(user, 200, res);
});

//@desc     Login user
//@route    POST /auth/login
//@access   Public
exports.signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  //Check for user
  let user = await User.findOne({ email }, { new: true }).select('+password');

  //No user found with incoming email
  if (!user) {
    return next(
      new ErrorResponse(
        'The username or password you entered is incorrect',
        401
      )
    );
  }

  //Check matching password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(
      new ErrorResponse(
        'The username or password you entered is incorrect',
        401
      )
    );
  }

  //Get user id and cart
  user = await User.findOne({ email }, { _id: 1, cart: 1 }, { new: true });

  sendTokenResponse(user, 200, res);
});

//@desc     Login user
//@route    POST /auth/logout
//@access   Private
exports.signOut = asyncHandler(async (req, res, next) => {
  //Delete cookie that has token
  res.clearCookie('token').status(200).json({ success: true });
});

//Create token, put it in cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //Create token
  const token = user.getSignedJwtToken();

  //Set options for expiration and http only
  const expires = new Date(
    Date.now() + process.env.COOKIE_EXPIRES_IN * 60 * 60 * 1000
  );

  const options = {
    expires: expires,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, user: user, expires: expires.getTime() });
};

//@desc     Get currently logged in user
//@route    Get /auth/me
//@access   Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
  res
    .status(200)
    .json({ success: true, user: req.user, expires: decoded.exp * 1000 });
});
