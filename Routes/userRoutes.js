import express from "express";
import {
  fetchLeaderboard,
  getProfile,
  login,
  logout,
  register,
  updatePassword,
} from "../Controller/userController.js";
import { isAuthenticated } from "../middleware/auth.js";
import { uploadProfile } from "../middleware/multer.js";

const router = express.Router();

router.post("/register", uploadProfile.single("profileImage"), register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/profile", isAuthenticated, getProfile);
router.get("/leaderboard", fetchLeaderboard);
router.put("/update-password", isAuthenticated, updatePassword);
export default router;
