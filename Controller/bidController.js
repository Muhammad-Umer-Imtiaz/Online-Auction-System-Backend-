import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { Bid } from "../Models/bidSchema.js";

export const placeBid = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!req.user || !req.user._id) {
    return next(new ErrorHandler("Unauthorized user.", 401));
  }

  if (!amount) {
    return next(new ErrorHandler("Please enter your bid amount.", 400));
  }

  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction Item not found.", 404));
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
    await existingBid.save(); // ✅ Only save this, no need to save sub-bid object
  } else {
    const bid = await Bid.create({
      amount,
      bidder: {
        id: bidderDetail._id,
        userName: bidderDetail.userName,
        profileImage: bidderDetail.profileImage?.url,
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

  res.status(201).json({
    success: true,
    message: "Bid placed successfully.",
    currentBid: auctionItem.currentBid,
  });
});
