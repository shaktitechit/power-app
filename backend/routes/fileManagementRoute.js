import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";
import { RESOURCES } from "../constants/resources.js";
import { ACTIONS } from "../constants/actions.js";
import {
  redirectToDownloadUrl,
  redirectToViewUrl,
} from "../controllers/fileManagementController.js";

const router = express.Router();

router.get(
  "/files/:fileId/view",
  protect,
  authorize(RESOURCES.FILE, ACTIONS.VIEW_DOCUMENT),
  redirectToViewUrl,
);
router.get(
  "/files/:fileId/download",
  protect,
  authorize(RESOURCES.FILE, ACTIONS.DOWNLOAD),
  redirectToDownloadUrl,
);

export default router;
