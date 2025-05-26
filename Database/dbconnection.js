import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGODB_URI, {
      dbName: "Auction_System",
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log(error);
  }
};
