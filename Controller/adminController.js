import mongoose from "mongoose";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { Auction } from "../Models/AuctionSchema.js";
import { PaymentProof } from "../Models/commisionProofSchema.js";
import { Commission } from "../Models/commisonSchema.js";
import { User } from "../models/userSchema.js";
import { Bid } from "../Models/bidSchema.js";

// ---------------------- DELETE AUCTION BY ADMIN ----------------------
export const deleteAuctionByAdmin = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }

  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  await Bid.deleteMany({ auctionItem: id });
  await auctionItem.deleteOne();

  res.status(200).json({
    success: true,
    message: "Auction item deleted successfully.",
  });
});

// ---------------------- GET ALL PAYMENT PROOFS ----------------------
export const getAllPaymentProofs = catchAsyncErrors(async (req, res, next) => {
  const paymentProofs = await PaymentProof.find();

  res.status(200).json({
    success: true,
    paymentProofs,
  });
});

// ---------------------- GET PAYMENT PROOF DETAIL ----------------------
export const getPaymentProofDetail = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid ID format.", 400));
    }

    const paymentProofDetail = await PaymentProof.findById(id);
    if (!paymentProofDetail) {
      return next(new ErrorHandler("Payment proof not found.", 404));
    }

    res.status(200).json({
      success: true,
      paymentProofDetail,
    });
  }
);

// ---------------------- UPDATE PAYMENT PROOF STATUS ----------------------
export const updateProofStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { amount, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid ID format.", 400));
  }

  let proof = await PaymentProof.findById(id);
  if (!proof) {
    return next(new ErrorHandler("Payment proof not found.", 404));
  }

  proof = await PaymentProof.findByIdAndUpdate(
    id,
    { status, amount },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Payment proof amount and status updated.",
    proof,
  });
});

// ---------------------- DELETE PAYMENT PROOF ----------------------
export const deletePaymentProof = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid ID format.", 400));
  }

  const proof = await PaymentProof.findById(id);
  if (!proof) {
    return next(new ErrorHandler("Payment proof not found.", 404));
  }

  await proof.deleteOne();

  res.status(200).json({
    success: true,
    message: "Payment proof deleted.",
  });
});

// ---------------------- FETCH USERS CREATED MONTHLY ----------------------
export const fetchAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.aggregate([
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        month: "$_id.month",
        year: "$_id.year",
        count: 1,
        _id: 0,
      },
    },
    {
      $sort: { year: 1, month: 1 },
    },
  ]);

  const transformDataToMonthlyArray = (data, totalMonths = 12) => {
    const result = Array(totalMonths).fill(0);
    data.forEach((item) => {
      result[item.month - 1] = item.count;
    });
    return result;
  };

  const monthlyUserCounts = transformDataToMonthlyArray(users);

  res.status(200).json({
    success: true,
    monthlyUserCounts,
  });
});

// ---------------------- MONTHLY REVENUE ----------------------
export const monthlyRevenue = catchAsyncErrors(async (req, res, next) => {
  const payments = await Commission.aggregate([
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const transformDataToMonthlyArray = (data, totalMonths = 12) => {
    const result = Array(totalMonths).fill(0);
    data.forEach((item) => {
      result[item._id.month - 1] = item.totalAmount;
    });
    return result;
  };

  const totalMonthlyRevenue = transformDataToMonthlyArray(payments);

  res.status(200).json({
    success: true,
    totalMonthlyRevenue,
  });
});

export const fetchUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res
      .status(200)
      .json({ message: "All user get Successfully", success: true, users });
  } catch (error) {
    new ErrorHandler("Internal Server Error", 500);
  }
});
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid Id format.", 400));
    }

    const deleteUser = await User.findById(id);
    if (!deleteUser) {
      return next(new ErrorHandler("user not found.", 404));
    }

    await Auction.deleteMany({ createdBy: id });

    // Delete all bids by this user
    await Bid.deleteMany({ userId: id });

    await deleteUser.deleteOne();
    res.status(200).json({
      success: true,
      message: "user deleted successfully.",
    });
  } catch (error) {
    new ErrorHandler("Internal Server Error", 500);
  }
});
