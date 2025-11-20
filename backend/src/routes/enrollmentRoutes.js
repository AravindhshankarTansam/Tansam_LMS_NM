import express from "express";
import {
  enrollCourse,
  getUserEnrollments,
  unenrollCourse,
  verifyCourseAccess,
  getEnrolledCourse, 
} from "../controllers/enrollmentController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ✅ Enrollment Routes
 * - POST /enrollments → Enroll user in a course
 * - GET /enrollments → Get all enrollments for logged-in user
 * - GET /enrollments/:courseId/access → Check if access is valid (3 months)
 * - DELETE /enrollments/:courseId → Unenroll from a course
 */

// Enroll user in a course
router.post("/", authenticateUser, enrollCourse);

// Get user's enrollments
router.get("/", authenticateUser, getUserEnrollments);

router.get("/:courseId", authenticateUser, getEnrolledCourse);

// Check access validity for a specific course
router.get("/:courseId/access", authenticateUser, verifyCourseAccess);

// Unenroll a user
router.delete("/:courseId", authenticateUser, unenrollCourse);

export default router;
