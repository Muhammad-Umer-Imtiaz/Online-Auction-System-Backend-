import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { uploadAuction } from "../middleware/multer.js";
import {
  addNewAuctionItem,
  deleteAuction,
  getAllAuctionItems,
  getMyAuctionItems,
  getSingleAuctionDetails,
  republishAuction,
  updateAuction,
} from "../Controller/auctionController.js";

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  uploadAuction.array("images", 5),
  addNewAuctionItem
);
router.get("/allitems", getAllAuctionItems);
router.get("/myitems/:id", isAuthenticated, getSingleAuctionDetails);
router.get("/myauctions", isAuthenticated, getMyAuctionItems);
router.delete("/delete/:id", isAuthenticated, deleteAuction);
router.put("/republish/:id", isAuthenticated, republishAuction);
router.put("/update/:id", isAuthenticated, updateAuction);

export default router;
