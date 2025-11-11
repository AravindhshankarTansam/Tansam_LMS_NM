import express from "express";
import {
  getChaptersByModule, createChapter, updateChapter, deleteChapter,
} from "../controllers/chapterController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { upload } from "../utils/fileHandler.js";

const router = express.Router();

router.get("/:module_id", authenticateUser, getChaptersByModule);
router.post("/", authenticateUser, upload.single("material"), createChapter);
router.put("/:id", authenticateUser, upload.single("material"), updateChapter);
router.delete("/:id", authenticateUser, deleteChapter);

export default router;
