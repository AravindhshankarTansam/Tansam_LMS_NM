import express from "express";
import { publishCourse } from "../controllers/nmPublishController.js";

const router = express.Router();
router.post("/nm/course/publish/:id", publishCourse);
export default router;
