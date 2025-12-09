import express from "express";
import { addUser, getUsers, updateUser, deleteUser } from "../controllers/adminController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { 
  getTotalStudents,
  getAllStudents,
  getTopLearners,
  getTopLearnersByCourse,
  getOverallLeaderboard,
  getStudentDayProgress,         // ⭐ NEW
} from "../controllers/userController.js";

const router = express.Router();

router.post("/add", upload.single("image"), addUser);
router.get("/all", getUsers);
router.put("/update/:custom_id", upload.single("image"), updateUser);
router.delete("/delete/:custom_id", deleteUser);

// ---------- STUDENT STATS ----------
router.get("/students/count", getTotalStudents);
router.get("/students/all", getAllStudents);
// 🔹 Day-wise progress for a student
// ---------- LEADERBOARDS ----------
router.get("/top-learners", getTopLearners);
router.get("/top-learners/course/:course_id", getTopLearnersByCourse);
router.get("/leaderboard", getOverallLeaderboard);

// ⭐⭐⭐ NEW ENDPOINTS FOR YOUR DASHBOARD ⭐⭐⭐
router.get("/student/:custom_id/progress/day", getStudentDayProgress);

// 🔹 Remaining chapters for a student
// router.get("/student/:custom_id/remaining-chapters", getRemainingChapters);


export default router;
