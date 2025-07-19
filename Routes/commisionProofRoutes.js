import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { uploadComissionProof } from "../middleware/multer.js";
import { proofOfCommission } from "../Controller/commissionProofController.js";

const router = express.Router();

router.post(
  "/post",
  isAuthenticated,
  uploadComissionProof.single("proof"),
  proofOfCommission
);

export default router;