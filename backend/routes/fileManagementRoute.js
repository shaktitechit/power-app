import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  redirectToDownloadUrl,
  redirectToViewUrl,
} from "../controllers/fileManagementController.js";

const router = express.Router();

router.get("/files/:fileId/view", redirectToViewUrl);
router.get("/files/:fileId/download", redirectToDownloadUrl);

export default router;
