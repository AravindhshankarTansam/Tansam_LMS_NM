import express from "express";
import { addUser, getUsers, updateUser, deleteUser } from "../controllers/adminController.js";
import { upload } from "../middleware/uploadMiddleware.js";


const router = express.Router();

router.post("/add", upload.single("image"), addUser);
router.get("/all", getUsers);
router.put("/update/:custom_id", upload.single("image"), updateUser);
router.delete("/delete/:custom_id", deleteUser);

export default router;
