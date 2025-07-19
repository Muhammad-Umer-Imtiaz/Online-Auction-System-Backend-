import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      minLength: [3, "Username must be at least 3 characters"],
      maxLength: [20, "Username must be at most 20 characters"],
    },
    password: {
      type: String,
      required: true,
      minLength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    email: String,
    address: String,
    phone: {
      type: String,
      minLength: [11, "Phone must be exactly 11 characters"],
      maxLength: [11, "Phone must be exactly 11 characters"],
    },
    accountType:{
      type:String,
      enum:["Easypaisa","JazzCash","SadaPay","Meezan Bank", "HBL Bank","Bank AlFalah","Al Faisal Bank"]
    },
    accountNo:String,
    accountName:String,
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    profileImage: {
      public_id: String,
      url: String,
    },
    unpaidComission: {
      type: Number,
      default: 0,
    },
    auctionsWOn: {
      type: Number,
      default: 0,
    },
    moneySpent: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: String,
  resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ✅ Prevent model overwrite error
export const User = mongoose.models.User || mongoose.model("User", userSchema);
