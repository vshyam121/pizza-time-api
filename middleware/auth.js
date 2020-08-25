const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const jwt = require('jsonwebtoken');

//@desc  Check if request has bearer token, then attach user object to request
exports.protect = asyncHandler(async (req, res, next) => {
  //Check headers for bearer token
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const bearer = authHeader.split(' ');
    req.token = bearer[1];
  }

  //Make sure token is in header
  if (!req.token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    //Verify token
    const decoded = jwt.verify(req.token, process.env.JWT_SECRET);

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
