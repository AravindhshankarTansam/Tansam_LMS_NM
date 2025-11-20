import express from "express";
import {
  getUserProgress,
  updateProgress,
  getUserCourseProgress,
} from "../controllers/progressController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/:custom_id/:course_id", authenticateUser, getUserCourseProgress);

// Get ALL progress for a user
router.get("/:custom_id", authenticateUser, getUserProgress);

// Get progress for a specific course


// Update progress (upsert)
router.put("/:custom_id", authenticateUser, updateProgress);

export default router;
