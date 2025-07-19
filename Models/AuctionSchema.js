import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    startingBid: {
      type: Number,
      required: true,
      min: 0,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    condition: {
      type: String,
      enum: ["New", "Used"],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bids: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        profileImage: String,
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    commissionCalculated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Check if model already exists before defining
export const Auction =
  mongoose.models.Auction || mongoose.model("Auction", auctionSchema);
