import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  loginUser,
  registerUser,
  getUserProfile,
  refreshAccessToken,
  userLogout,
  refreshSessionTimer,
  getAuditors,
  updateUser,
  deleteUser,
} from "../controllers/usersController.js";
import {
  apiRateLimiter,
  authRateLimiter,
} from "../middlewares/rateLimitLoggerMiddleware.js";

const router = express.Router();

// 🔐 Auth (refresh uses general API limiter — token rotation is not brute-force like login)
router.post("/register", authRateLimiter, registerUser);
router.post("/login", authRateLimiter, loginUser);
router.post("/refresh", apiRateLimiter, refreshAccessToken);
router.post("/logout", userLogout);
router.post("/refresh-timer", protect, refreshSessionTimer);

// 👤 Profile
router.get("/profile", protect, getUserProfile);

// 👥 Users
router.get("/auditors", protect, getAuditors);

// ✏️ Edit + Delete (NEW)
router.route("/:id").put(protect, updateUser).delete(protect, deleteUser);

export default router;
