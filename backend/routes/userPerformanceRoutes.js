import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getUserPerformanceSummary,
  getUserPerformanceFacilities,
  getUserPerformanceUtilityAccounts,
  getUserPerformanceCompletedAudits,
  getUserPerformancePresence,
  getUserPerformancePresenceActivities,
} from "../controllers/userPerformanceController.js";

const router = express.Router();

router.get("/:userId/summary", protect, getUserPerformanceSummary);
router.get("/:userId/facilities", protect, getUserPerformanceFacilities);
router.get("/:userId/utility-accounts", protect, getUserPerformanceUtilityAccounts);
router.get("/:userId/completed-audits", protect, getUserPerformanceCompletedAudits);
router.get("/:userId/presence", protect, getUserPerformancePresence);
router.get(
  "/:userId/presence/activities",
  protect,
  getUserPerformancePresenceActivities,
);

export default router;
