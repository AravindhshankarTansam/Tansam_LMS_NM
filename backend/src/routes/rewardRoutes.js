import express from "express";
import { getRewards, updateReward } from "../controllers/rewardController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fetch rewards by user
router.get("/:custom_id", authenticateUser, getRewards);

// Update reward manually (admin)
router.put("/:id", authenticateUser, updateReward);

export default router;
