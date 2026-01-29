import express from "express";
import {
  subscribeCourse,
  accessCourse,
  getProgress,
} from "../controllers/kpController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/subscribe", authenticateUser, subscribeCourse);
router.post("/access", authenticateUser, accessCourse);
router.post("/progress", authenticateUser, getProgress);

export default router;
