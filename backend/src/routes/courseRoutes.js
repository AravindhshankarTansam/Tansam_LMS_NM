import express from "express";
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { uploadCourseMaterial as upload } from "../middleware/courseMiddleware.js"; 
 // ✅ import multer setup

const router = express.Router();

// ✅ Routes
router.get("/", authenticateUser, getAllCourses);

// ✅ Use multer for image upload
router.post("/", authenticateUser, upload.single("course_image"), createCourse);
router.put("/:id", authenticateUser, upload.single("course_image"), updateCourse);

router.delete("/:id", authenticateUser, deleteCourse);

export default router;
