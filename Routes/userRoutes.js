import express from "express";
import {
  fetchLeaderboard,
  forgetPassword,
  getProfile,
  login,
  logout,
  register,
  resetPassword,
  updatePassword,
  updateProfile,
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
router.put(
  "/update-profile",
  isAuthenticated,
  uploadProfile.single("profileImage"),
  updateProfile
);
router.post("/password/forgot", forgetPassword);
router.put("/password/reset/:token", resetPassword);

router.get("/me", isAuthenticated, async (req, res) => {
  res.status(200).json({ user: req.user });
});
export default router;
