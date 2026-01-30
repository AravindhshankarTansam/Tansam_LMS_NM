import express from "express";
import {
  getSubstreams,
  addSubstream,
  updateSubstream,
  deleteSubstream,
} from "../controllers/substreamController.js";

const router = express.Router();

router.get("/", getSubstreams);
router.post("/", addSubstream);
router.put("/:substream_id", updateSubstream);
router.delete("/:substream_id", deleteSubstream);

export default router;
