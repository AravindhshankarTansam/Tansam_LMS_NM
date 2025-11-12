// routes/moduleRoutes.js
import express from "express";
import {
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule,
} from "../controllers/moduleController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Get all modules by course_id
router.get("/:course_id", authenticateUser, getModulesByCourse);

// ✅ Create module
router.post("/", authenticateUser, createModule);

// ✅ Update module
router.put("/:id", authenticateUser, updateModule);

// ✅ Delete module
router.delete("/:id", authenticateUser, deleteModule);

export default router;