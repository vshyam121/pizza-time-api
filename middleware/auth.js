const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const jwt = require('jsonwebtoken');

//@desc  Check if request has a cookie with a valid token, then attach user object to request
exports.protect = asyncHandler(async (req, res, next) => {
  //Check cookie for token
  let token;
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  //Make sure token is in header
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    //Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //Token expired, not authorized access
    if (Date.now() / 1000 > decoded.exp) {
      return next(
        new ErrorResponse('Not authorized to access this route', 401)
      );
    }

    //Get user from user id in token and attach to request
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});
