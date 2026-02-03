import express from "express";
import { accessCourse } from "../controllers/nmAccessController.js";
import { verifyNMToken } from "../middleware/nmAuthMiddleware.js";

const router = express.Router();

router.post("/course/access", verifyNMToken, accessCourse);

export default router;
