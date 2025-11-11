// routes/courseCategoryRoutes.js
import express from "express";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/courseCategoryController.js";

const router = express.Router();

// ✅ CRUD endpoints
router.get("/", getCategories);
router.post("/", addCategory);
router.put("/:category_id", updateCategory);
router.delete("/:category_id", deleteCategory);

export default router;
