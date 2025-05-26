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
      minLength: [11, "Password must be at least 11 characters"],
      maxLength: [11, "Password must be at most 11 characters"],
    },
    profileImage: {
      public_id: String,
      url: String,
    },
    paymentMethod: {
      bankTransfer: {
        bankAccountNumber: Number,
        bankAccountName: String,
        bankName: String,
      },
      easypaisa: {
        easypaisaAccountNumber: Number,
      },
      jazzcashAccountNumber: {
        jazzcashAccountNumber: Number,
      },
    },
    role: {
      type: String,
      default: "user",
      enum: ["Auctioneer", "Bidder", "Super Admin"],
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
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}
userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({id:this._id}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
}
export const User = mongoose.model("User", userSchema);
