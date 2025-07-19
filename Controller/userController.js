import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { User } from "../Models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendMail } from "../utils/sendMail.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const profileImage = req.file;
  if (!profileImage)
    return next(new ErrorHandler("Profile Image Required.", 400));

  const { userName, email, password, phone, address, accountNo, accountName,accountType } =
    req.body;
  if (
    !userName ||
    !email ||
    !password ||
    !phone ||
    !address ||
    !accountNo ||
    !accountName || !accountType
  )
    return next(new ErrorHandler("Please fill full form.", 400));

  // Your validation logic ...

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("User already registered.", 400));
  }

  // Now just use the info from req.file (uploaded to cloudinary already)
  const user = await User.create({
    userName,
    email,
    password, // Hash in model or here
    phone,
    address,
    accountNo,
    accountName,
    accountType,
    profileImage: {
      public_id: profileImage.filename,
      url: profileImage.path,
    },
  });

  generateToken(user, "User Registered Successfully.", 200, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please fill full form."));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(
      new ErrorHandler("User Not Found Please Enter Correct EMAIL.", 400)
    );
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Password is Incorrect.", 400));
  }

  generateToken(user, "Login successfully.", 200, res);
});

export const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logout Successfully.",
    });
});

export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ moneySpent: { $gt: 0 } });
  const leaderboard = users.sort((a, b) => b.moneySpent - a.moneySpent);

  res.status(200).json({
    success: true,
    leaderboard,
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(
      new ErrorHandler("Please provide both old and new passwords.", 400)
    );
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Old password is incorrect.", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

// You'll need a util for sending emails

export const forgetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please provide your email address.", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new ErrorHandler(
        "User not found with this email. Please register first.",
        404
      )
    );
  }

  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token & set expire
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `http://localhost:5173/password/reset/${resetToken}`;

  // Email message
  const text = `
    You requested a password reset. Please make a PUT request to: \n\n
    This link is expire in 15 Minutes \n\n
    ${resetUrl} \n
    if you don't know What is this Please ignore it 
  `;

  try {
    await sendMail({
      email: user.email,
      subject: "Password Reset Request From EZ Auctions",
      text,
    });

    res.status(200).json({
      success: true,
      message: `Password reset link sent to ${user.email}`,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Email could not be sent", 500));
  }
});
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Reset token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { userName, phone, address, accountNo, accountName } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  // Handle profile image update
  if (req.file) {
    // Delete old image from Cloudinary
    if (user.profileImage && user.profileImage.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }

    // Upload new image
    user.profileImage = {
      public_id: req.file.filename,
      url: req.file.path,
    };
  }

  // Update other fields
  if (userName) user.userName = userName;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (accountNo) user.accountNo = accountNo;
  if (accountName) user.accountName = accountName;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user,
  });
});
