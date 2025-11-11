import express from "express";
import {
  getUserProgress, updateProgress,
} from "../controllers/progressController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:user_id", authenticateUser, getUserProgress);
router.put("/:user_id", authenticateUser, updateProgress);

export default router;
