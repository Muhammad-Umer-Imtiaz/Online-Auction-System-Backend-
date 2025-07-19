import mongoose from "mongoose";
import { Auction } from "../Models/AuctionSchema.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import { User } from "../Models/userSchema.js";
import ErrorHandler from "../middleware/error.js";
import { PaymentProof } from "../Models/commisionProofSchema.js";

export const calculateCommission = async (auctionId) => {
  const auction = await Auction.findById(auctionId);
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    return next(new ErrorHandler("Invalid Auction Id format.", 400));
  }
  const commissionRate = 0.05;
  const commission = auction.currentBid * commissionRate;
  return commission;
};

export const proofOfCommission = catchAsyncErrors(async (req, res, next) => {
  const proof = req.file;
  const { amount, comment } = req.body;
  const user = await User.findById(req.user._id);
  if (!amount || !proof) {
    return next(new ErrorHandler("Amount  are required fields.", 400));
  }

  if (user.unpaidComission === 0) {
    return next(new ErrorHandler(`You Donot have unpaid Commission`, 403));
  }

  if (user.unpaidComission < amount) {
    return next(
      new ErrorHandler(
        `The amount exceeds your unpaid commission balance. Please enter an amount up to ${user.unpaidComission}`,
        403
      )
    );
  }

  const commissionProof = await PaymentProof.create({
    userId: req.user._id,
    proof: {
      public_id: proof.filename,
      url: proof.path,
    },
    amount,
    comment,
  });
  res.status(201).json({
    success: true,
    message:
      "Your proof has been submitted successfully. We will review it and respond to you within 24 hours.",
    commissionProof,
  });
});
