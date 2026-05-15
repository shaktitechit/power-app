import asyncHandler from "../middlewares/asyncHandler.js";
import Notification from "../modals/notification.js";

// @route   GET /api/v1/notifications
// @desc    Get user notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    let query = { recipient: req.user._id };
    
    // If super_admin wants to see all notifications
    if (req.user.role === "super_admin" && req.query.all === "true") {
        query = {}; // All notifications
    }

    const notifications = await Notification.find(query)
        .populate("recipient", "name email")
        .populate("sender", "name email")
        .sort({ created_at: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
    });
});

const markAsRead = asyncHandler(async (req, res) => {
    let query = { _id: req.params.id };
    let update = { isRead: true };

    if (req.user.role === "super_admin" && req.query.all === "true") {
        update = { superAdminRead: true };
    } else {
        query.recipient = req.user._id;
    }

    const notification = await Notification.findOneAndUpdate(
        query,
        update,
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    res.status(200).json({
        success: true,
        data: notification,
    });
});

const markAllAsRead = asyncHandler(async (req, res) => {
    let query = { isRead: false };
    let update = { isRead: true };

    if (req.user.role === "super_admin" && req.query.all === "true") {
        query = { superAdminRead: false };
        update = { superAdminRead: true };
    } else {
        query.recipient = req.user._id;
    }

    await Notification.updateMany(
        query,
        update
    );

    res.status(200).json({
        success: true,
        message: "All notifications marked as read",
    });
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
