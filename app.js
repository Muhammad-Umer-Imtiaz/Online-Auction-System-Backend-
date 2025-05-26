import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./Database/dbconnection.js";
import ErrorHandler, { errorMiddleware } from "./middleware/error.js";
import userRoutes from "./Routes/UserRoutes.js";
import categoryRoutes from "./Routes/categoryRoutes.js";
import auctionRoutes from "./Routes/auctionRoutes.js";
import bidRoutes from "./Routes/bidRoutes.js"

const app = express();

// Load environment variables
dotenv.config({ path: "./.env" });

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to database
connectDB();

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/auction", auctionRoutes);
app.use("/api/v1/category", categoryRoutes);
// Handle unknown routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorMiddleware);

export default app;
