import asyncHandler from "../middlewares/asyncHandler.js";
import { VALID_MODES } from "../constants/modes.js";
import PresenceLog from "../modals/presenceLog.js";
import redisClient from "../lib/redisClient.js";
import { cookieDefaults } from "../utils/authTokens.js";

/**
 * @desc    Set the operational mode via an httpOnly cookie
 * @route   POST /api/v1/mode/set
 * @access  Private
 * @body    { mode: "onsite" | "offsite" }
 */
const setMode = asyncHandler(async (req, res) => {
  const { mode } = req.body;
  const userId = req.user?._id;

  if (!mode || !VALID_MODES.includes(mode)) {
    res.status(400);
    throw new Error(
      `Invalid mode. Accepted values are: ${VALID_MODES.join(", ")}`
    );
  }

  res.cookie("mode", mode, {
    ...cookieDefaults(),
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // If user is currently online, split the presence log session
  // so that the old mode stops counting and the new mode starts counting.
  if (userId) {
    try {
      const presenceKey = `presence:${userId}`;
      const currentStatus = await redisClient.get(presenceKey);

      if (currentStatus === "online") {
        // Close previous session
        await PresenceLog.create({
          userId,
          status: "offline",
          reason: "mode-switch-pre",
        });

        // Start new session with new mode
        await PresenceLog.create({
          userId,
          status: "online",
          mode,
          reason: "mode-switch-post",
        });
      }
    } catch (error) {
      // Log error but don't fail the request
      console.error("Failed to split presence log on mode change:", error);
    }
  }

  res.status(200).json({
    success: true,
    message: `Mode set to "${mode}" successfully`,
    data: { mode },
  });
});

/**
 * @desc    Get the current mode from the httpOnly cookie
 * @route   GET /api/v1/mode
 * @access  Private
 */
const getMode = asyncHandler(async (req, res) => {
  const mode = req.cookies?.mode || null;

  res.status(200).json({
    success: true,
    data: { mode },
  });
});

/**
 * @desc    Clear the mode cookie
 * @route   DELETE /api/v1/mode
 * @access  Private
 */
const clearMode = asyncHandler(async (req, res) => {
  res.clearCookie("mode", {
    ...cookieDefaults(),
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Mode cookie cleared successfully",
    data: { mode: null },
  });
});

export { setMode, getMode, clearMode };
