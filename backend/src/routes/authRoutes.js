import express from "express";
import { loginUser,getCurrentUser } from "../controllers/authController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
const router = express.Router();

// =======================
// AUTH ROUTES
// =======================
router.post("/login", loginUser);
router.get("/me", authenticateUser, getCurrentUser);

// =======================
// REGISTER ROUTES (NEW)
// =======================
router.post("/register-request", registerRequest);
router.post("/set-password", setPassword);

export default router;
