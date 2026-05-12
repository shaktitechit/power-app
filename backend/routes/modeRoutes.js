import express from "express";
import { setMode, getMode, clearMode } from "../controllers/modeController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMode);
router.post("/set", protect, setMode);
router.delete("/", protect, clearMode);

export default router;
