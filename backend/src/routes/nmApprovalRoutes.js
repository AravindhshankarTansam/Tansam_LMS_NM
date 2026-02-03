import express from "express";
import { approveNMCourse } from "../controllers/nmApprovalController.js";

const router = express.Router();

router.post("/nm/course/approved", approveNMCourse);

export default router;
