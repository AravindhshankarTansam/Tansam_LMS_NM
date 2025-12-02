import express from "express";
import {
  getUserProgress,
  updateProgress,
  getUserCourseProgress,
  resetModuleProgress
} from "../controllers/progressController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/:custom_id/:course_id", authenticateUser, getUserCourseProgress);

// Get ALL progress for a user
router.get("/:custom_id", authenticateUser, getUserProgress);

// Get progress for a specific course


// Update progress (upsert)
router.put("/:custom_id", authenticateUser, updateProgress);

// THIS IS THE PROFESSIONAL WAY
router.post("/reset-module/:custom_id", authenticateUser, resetModuleProgress);

export default router;
