import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { Auction } from "../Models/auctionSchema.js";
import mongoose from "mongoose";
import { User } from "../Models/userSchema.js";
import { Bid } from "../Models/bidSchema.js";
export const addNewAuctionItem = catchAsyncErrors(async (req, res, next) => {
  try {
    const images = req.files;

    if (!images || images.length === 0) {
      return next(new ErrorHandler("At least one image is required.", 400));
    }

    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    for (let file of images) {
      if (!allowedFormats.includes(file.mimetype)) {
        return next(
          new ErrorHandler("One or more image formats are not supported.", 400)
        );
      }
    }

    const {
      title,
      description,
      startingBid,
      category,
      condition,
      startTime,
      endTime,
    } = req.body;

    if (
      !title ||
      !description ||
      !startingBid ||
      !category ||
      !condition ||
      !startTime ||
      !endTime
    ) {
      return next(new ErrorHandler("Please fill all fields.", 400));
    }

    if (condition !== "New" && condition !== "Used") {
      return next(
        new ErrorHandler("Condition must be either 'New' or 'Used'.", 400)
      );
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return next(new ErrorHandler("Start time must be before end time.", 400));
    }

    if (new Date(startTime) < Date.now()) {
      return next(new ErrorHandler("Start time must be in the future.", 400));
    }

    const alreadyOneAuctionActive = await Auction.find({
      createdBy: req.user._id,
      endTime: { $gt: Date.now() },
    });

    if (alreadyOneAuctionActive.length > 0) {
      return next(
        new ErrorHandler("You already have one active auction.", 400)
      );
    }

    const imageLinks = images.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));

    const auctionItem = await Auction.create({
      title,
      description,
      startingBid,
      category,
      condition,
      startTime,
      endTime,
      images: imageLinks,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Auction item created successfully and will be listed on auction page at ${startTime}`,
      auctionItem,
    });
  } catch (error) {
    return next(
      new ErrorHandler(error.message || "Failed to create auction item.", 500)
    );
  }
});

export const getAllAuctionItems = catchAsyncErrors(async (req, res, next) => {
  const items = await Auction.find().populate(
    "createdBy",
    "userName profileImage"
  );
  // const items = await Auction.find()
  res.status(200).json({
    success: true,
    items,
  });
});

export const getSingleAuctionDetails = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid Id format.", 400));
    }
    const auctionItem = await Auction.findById(id);
    if (!auctionItem) {
      return next(new ErrorHandler("Auction not found.", 404));
    }
    const bidders = auctionItem.bids.sort((a, b) => b.amount - a.amount);
    res.status(200).json({
      success: true,
      auctionItem,
      bidders,
    });
  }
);
export const getMyAuctionItems = catchAsyncErrors(async (req, res, next) => {
  const items = await Auction.find({ createdBy: req.user._id });
  res.status(200).json({
    success: true,
    items,
  });
});

export const deleteAuction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  await auctionItem.deleteOne();
  res.status(200).json({
    success: true,
    message: "Auction item deleted successfully.",
  });
});

export const republishAuction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { startTime, endTime, startingBid } = req.body;
  const userId = req.user;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format", 400));
  }

  const auction = await Auction.findById(id);

  if (!auction) return next(new ErrorHandler("Auction not found", 404));

  if (auction.createdBy.toString() !== userId._id.toString()) {
    return next(
      new ErrorHandler("You are not authorized to republish this auction", 403)
    );
  }

  if (new Date(startTime) >= new Date(endTime)) {
    return next(new ErrorHandler("Start time must be before end time", 400));
  }

  if (new Date(startTime) < Date.now()) {
    return next(new ErrorHandler("Start time must be in the future", 400));
  }
  if (auction.highestBidder) {
    const highestBidder = await User.findById(auction.highestBidder);
    highestBidder.moneySpent -= auctionItem.currentBid;
    highestBidder.auctionsWOn -= 1;
    highestBidder.save();
  }

  // Update allowed fields
  auction.startTime = startTime;
  auction.endTime = endTime;
  auction.startingBid = startingBid;
  auction.currentBid = 0;
  auction.commissionCalculated = false;
  auction.highestBidder = null;
  auction.bids = [];
  await Bid.deleteMany({ auctionItem: auction._id });

  await auction.save();
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  user.unpaidComission = 0;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Auction republished successfully",
    auction,
  });
});
export const updateAuction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    title,
    description,
    startTime,
    endTime,
    condition,
    category,
    startingBid,
  } = req.body;
  const newImages = req.files;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid auction ID format.", 400));
  }

  const auction = await Auction.findById(id);
  if (!auction) {
    return next(new ErrorHandler("Auction not found.", 404));
  }

  if (auction.createdBy.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("You are not authorized to update this auction.", 403)
    );
  }

  if (auction.bids.length > 0) {
    return next(
      new ErrorHandler(
        "You cannot update an auction that already has bids.",
        400
      )
    );
  }

  if (condition && condition !== "New" && condition !== "Used") {
    return next(
      new ErrorHandler("Condition must be either 'New' or 'Used'.", 400)
    );
  }

  const updatedStartTime = startTime || auction.startTime;
  const updatedEndTime = endTime || auction.endTime;

  if (new Date(updatedStartTime) >= new Date(updatedEndTime)) {
    return next(new ErrorHandler("Start time must be before end time.", 400));
  }

  if (new Date(updatedStartTime) < Date.now()) {
    return next(new ErrorHandler("Start time must be in the future.", 400));
  }

  if (newImages && Array.isArray(newImages) && newImages.length > 0) {
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    for (let file of newImages) {
      if (!allowedFormats.includes(file.mimetype)) {
        return next(
          new ErrorHandler("One or more image formats are not supported.", 400)
        );
      }
    }

    const imageLinks = newImages.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
    auction.images = imageLinks;
  }

  if (title) auction.title = title;
  if (startingBid) auction.startingBid = Number(startingBid);
  if (description) auction.description = description;
  if (startTime) auction.startTime = startTime;
  if (endTime) auction.endTime = endTime;
  if (condition) auction.condition = condition;
  if (category) auction.category = category;

  await auction.save();

  res.status(200).json({
    success: true,
    message: "Auction updated successfully.",
    auction,
  });
});
