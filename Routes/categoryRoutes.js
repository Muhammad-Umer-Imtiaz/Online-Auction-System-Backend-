import express from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../Controller/categoryController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All categories (public - for dropdown)
router.get("/getall", getAllCategories);

// Admin-only category routes
router.post("/new", isAuthenticated ,authorizeRoles("admin"), createCategory);
router.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateCategory
);
router.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCategory
);

export default router;
