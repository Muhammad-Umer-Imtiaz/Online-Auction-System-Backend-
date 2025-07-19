import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { Bid } from "../Models/bidSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { sendMail } from "../utils/sendMail.js";

export const placeBid = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount) {
    return next(new ErrorHandler("Please enter your bid amount.", 400));
  }

  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction Item not found.", 404));
  }

  if (auctionItem.createdBy.equals(req.user._id)) {
    return next(
      new ErrorHandler("You can't bid on your own product or items.", 401)
    );
  }

  if (amount <= auctionItem.currentBid) {
    return next(
      new ErrorHandler("Bid amount must be greater than the current bid.", 400)
    );
  }

  if (amount < auctionItem.startingBid) {
    return next(
      new ErrorHandler("Bid amount must be greater than the starting bid.", 400)
    );
  }

  const bidderDetail = await User.findById(req.user._id);
  if (!bidderDetail) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // ✅ Find the previous highest bidder (if any)
  let previousHighestBidder = null;
  if (auctionItem.bids.length > 0) {
    // Find the highest bid in the bids array
    const highestBid = auctionItem.bids.reduce((prev, current) => {
      return prev.amount > current.amount ? prev : current;
    });

    // If the highest bid was from another user
    if (highestBid.userId.toString() !== req.user._id.toString()) {
      previousHighestBidder = await User.findById(highestBid.userId);
    }
  }

  // ✅ Update bid or create new one
  const existingBid = await Bid.findOne({
    "bidder.id": req.user._id,
    auctionItem: auctionItem._id,
  });

  const existingBidInAuction = auctionItem.bids.find(
    (bid) => bid.userId.toString() === req.user._id.toString()
  );

  if (existingBid && existingBidInAuction) {
    existingBid.amount = amount;
    existingBidInAuction.amount = amount;
    await existingBid.save();
  } else {
    const bid = await Bid.create({
      amount,
      bidder: {
        id: bidderDetail._id,
        userName: bidderDetail.userName,
        profileImage: bidderDetail.profileImage?.url,
        amount,
      },
      auctionItem: auctionItem._id,
    });

    auctionItem.bids.push({
      userId: req.user._id,
      userName: bidderDetail.userName,
      profileImage: bidderDetail.profileImage?.url,
      amount,
    });
  }

  auctionItem.currentBid = amount;
  await auctionItem.save();

  // ✅ Send outbid email if applicable
  if (previousHighestBidder) {
    const auctionLink = `http://localhost:5173/auction/item/${auctionItem._id}`;
    await sendMail({
      email: previousHighestBidder.email,
      subject: "You've been outbid on EZ Auctions!",
      text: `Hello ${previousHighestBidder.userName},\n\nSomeone has placed a higher bid on "${auctionItem.title}". Visit the auction to place a new bid and stay in the game!\n\nAuction link is here ${auctionLink} \n\nEZ Auctions`,
    });
  }

  res.status(201).json({
    success: true,
    message: "Bid placed successfully.",
    currentBid: auctionItem.currentBid,
  });
});

export const getBids = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const auctionItem = await Auction.findById(id).populate({
    plath: "bids.userId",
    select: "userName profileImage",
  });
  if (!auctionItem) {
    return next(new ErrorHandler("Auction Item not found.", 404));
  }
});
