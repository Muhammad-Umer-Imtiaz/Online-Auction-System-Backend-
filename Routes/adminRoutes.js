import express from "express";
import {
  deleteAuctionByAdmin,
  deletePaymentProof,
  deleteUser,
  fetchAllUsers,
  fetchUser,
  getAllPaymentProofs,
  getPaymentProofDetail,
  monthlyRevenue,
  updateProofStatus,
} from "../Controller/adminController.js";
import { authorizeRoles, isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.delete(
  "/auctionitem/delete/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteAuctionByAdmin
);

router.get(
  "/paymentproofs/getall",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllPaymentProofs
);

router.get(
  "/paymentproof/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  getPaymentProofDetail
);

router.put(
  "/paymentproof/status/update/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateProofStatus
);

router.delete(
  "/paymentproof/delete/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deletePaymentProof
);

router.get(
  "/users/getall",
  isAuthenticated,
  authorizeRoles("admin"),
  fetchAllUsers
);

router.get(
  "/monthlyincome",
  isAuthenticated,
  authorizeRoles("admin"),
  monthlyRevenue
);
router.get("/getuser", isAuthenticated, authorizeRoles("admin"), fetchUser);
router.delete("/deleteuser/:id", isAuthenticated, authorizeRoles("admin"), deleteUser);

export default router;
