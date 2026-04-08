import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  redirectToDownloadUrl,
  redirectToViewUrl,
} from "../controllers/fileManagementController.js";

const router = express.Router();

router.get("/files/:fileId/view", protect, redirectToViewUrl);
router.get("/files/:fileId/download", protect, redirectToDownloadUrl);

export default router;
