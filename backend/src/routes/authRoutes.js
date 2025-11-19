import express from "express";
import { loginUser,getCurrentUser } from "../controllers/authController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/login", loginUser);
router.get("/me", authenticateUser, getCurrentUser);

export default router;
