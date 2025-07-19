import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { checkAuctionEndTime } from "../middleware/checkAuctionEndTime.js";
import { placeBid } from "../Controller/bidController.js";

const router = express.Router();
router.post("/place/:id", isAuthenticated, checkAuctionEndTime, placeBid);
export default router;
