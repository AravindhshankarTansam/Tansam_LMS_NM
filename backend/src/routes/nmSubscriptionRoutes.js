import express from "express";
import { subscribeCourse } from "../controllers/nmSubscriptionController.js";
import { verifyNMToken } from "../middleware/nmAuthMiddleware.js";

const router = express.Router();

router.post("/course/subscribe", verifyNMToken, subscribeCourse);

export default router;
