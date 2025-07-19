import jwt from "jsonwebtoken";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import { User } from "../models/userSchema.js";
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return next(new ErrorHandler("User not authenticated.", 400));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new ErrorHandler("Json web token is invalid, Try again.", 400));
  }
});
export const authorizeRoles = (...roles) => {
  return catchAsyncErrors(async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${
            req.user?.role || "Unknown" 
          } is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  });
};
