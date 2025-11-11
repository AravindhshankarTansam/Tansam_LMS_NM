import express from "express";
import {
  getModulesByCourse, createModule, updateModule, deleteModule,
} from "../controllers/moduleController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:course_id", authenticateUser, getModulesByCourse);
router.post("/", authenticateUser, createModule);
router.put("/:id", authenticateUser, updateModule);
router.delete("/:id", authenticateUser, deleteModule);

export default router;
