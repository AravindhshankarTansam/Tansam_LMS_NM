import express from "express";
import {
  issueCertificate,
  getCertificatesByUser,
  generateUserCertificateByUser,
} from "../controllers/certificateController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Generate certificate manually (user-triggered)
router.post("/", authenticateUser, generateUserCertificateByUser);

// ✅ Issue certificate (system/admin triggered)
router.post("/issue", authenticateUser, issueCertificate);

// ✅ Get all certificates for a specific user
router.get("/:email", authenticateUser, getCertificatesByUser);

export default router;
