import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { Auction } from "../Models/AuctionSchema.js";
import mongoose from "mongoose";
import { User } from "../models/userSchema.js";
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

export const getSingleAuctionDetails = catchAsyncErrors(async (req, res, next) => {
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

  const auction = await Auction.findById(id);

  if (!auction) return next(new ErrorHandler("Auction not found", 404));

  if (auction.createdBy.toString() !== req.user._id.toString()) {
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

  // Update allowed fields
  auction.startTime = startTime;
  auction.endTime = endTime;
  auction.startingBid = startingBid;
  auction.currentBid = 0;
  auction.highestBidder = null;
  auction.bids = []; // optional: clear previous bids

  await auction.save();

  res.status(200).json({
    success: true,
    message: "Auction republished successfully",
    auction,
  });
});
