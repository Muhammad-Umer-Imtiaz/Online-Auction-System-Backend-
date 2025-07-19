import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, "Bid amount must be positive"],
    },
    bidder: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      userName: String, // optional: cache for display speed
      profileImage: String, // optional: cache for display speed
      amount:Number
    },
    auctionItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

export const Bid = mongoose.model("Bid", bidSchema);
