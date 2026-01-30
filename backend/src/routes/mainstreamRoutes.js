import express from "express";
import {
  getMainstreams,
  addMainstream,
  updateMainstream,
  deleteMainstream,
} from "../controllers/mainstreamController.js";

const router = express.Router();

router.get("/", getMainstreams);
router.post("/", addMainstream);
router.put("/:mainstream_id", updateMainstream);
router.delete("/:mainstream_id", deleteMainstream);

export default router;
