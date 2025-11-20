// routes/index.js
import express from "express";
import courseRoutes from "./courseRoutes.js";
import moduleRoutes from "./moduleRoutes.js";
import chapterRoutes from "./chapterRoutes.js";
import quizRoutes from "./quizRoutes.js";
import progressRoutes from "./progressRoutes.js";
import rewardRoutes from "./rewardRoutes.js";
import certificateRoutes from "./certificateRoutes.js";
import courseCategoryRoutes from "./courseCategoryRoutes.js"; // ✅ fixed path
import enrollmentRoutes from "./enrollmentRoutes.js";

const router = express.Router();

// ✅ Combine all route groups
router.use("/courses", courseRoutes);
router.use("/modules", moduleRoutes);
router.use("/chapters", chapterRoutes);
router.use("/quizzes", quizRoutes);
router.use("/progress", progressRoutes);
router.use("/rewards", rewardRoutes);
router.use("/certificate", certificateRoutes);
router.use("/course-categories", courseCategoryRoutes); // ✅ Correctly added here
router.use("/enrollments", enrollmentRoutes);

export default router;
