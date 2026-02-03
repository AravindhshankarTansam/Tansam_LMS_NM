import express from "express";
import {
  getAllCourses,
  createCourse,
  updateCourse,
  // enrollCourse,
  deleteCourse,
  getCourseById,
  getCourseStructure,
  getNMCourses
} from "../controllers/courseController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { uploadCourseMaterial } from "../middleware/courseMiddleware.js";

const router = express.Router();

/**
 * ✅ Multer setup:
 * Handles both image + video in a single request
 * Fields allowed:
 *   - course_image
 *   - video
 */
const upload = uploadCourseMaterial.fields([
  { name: "course_image", maxCount: 1 },
  { name: "course_video", maxCount: 1 },
]);

// ✅ Get all courses

// ✅ DASHBOARD APIs FIRST
router.get("/dashboard/nm-courses", getNMCourses);

router.get("/", getAllCourses);
// ✅ Protected: get a single course by ID
router.get("/:id", authenticateUser, getCourseById);

// ✅ Enroll a student
// router.post("/enroll", authenticateUser, enrollCourse);

// ✅ Create a new course (with image, video & is_active)
router.post("/", authenticateUser, upload, createCourse);

// ✅ Update course (with image, video & is_active)
router.put("/:id", authenticateUser, upload, updateCourse);

// ✅ Delete a course
router.delete("/:id", authenticateUser, deleteCourse);

//get list of modules and lessons for a course
router.get("/course-structure/:course_id", getCourseStructure);


export default router;
