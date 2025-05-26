import { Category } from '../Models/categorySchema.js';
import ErrorHandler from '../middleware/error.js';
import {catchAsyncErrors} from '../middleware/catchAsyncError.js';

// Create a category (Admin only)
export const createCategory = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;

  if (!name) return next(new ErrorHandler('Category name is required', 400));

  const existing = await Category.findOne({ name });
  if (existing) return next(new ErrorHandler('Category already exists', 400));

  const category = await Category.create({ name });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category,
  });
});

// Get all categories (for dropdown)
export const getAllCategories = catchAsyncErrors(async (req, res, next) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    categories,
  });
});

// Update category (Admin only)
export const updateCategory = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) return next(new ErrorHandler('Category not found', 404));

  category.name = name || category.name;
  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    category,
  });
});

// Delete category (Admin only)
export const deleteCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) return next(new ErrorHandler('Category not found', 404));

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});
