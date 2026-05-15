import Notification from "../modals/notification.js";
import { onlineUsers } from "../socket/socketServer.js";

export const createNotification = async (io, {
    recipient,
    sender = null,
    title,
    message,
    type,
    referenceId = null,
}) => {
    try {
        const notification = await Notification.create({
            recipient,
            sender,
            title,
            message,
            type,
            referenceId,
        });

        // Check if recipient is online and emit socket event
        if (io) {
            if (recipient) {
                const socketId = onlineUsers.get(String(recipient));
                if (socketId) {
                    io.to(socketId).emit("new-notification", notification);
                }
            }
            
            // Also emit to super-admins room so they get real-time updates for all notifications
            io.to("super-admins").emit("new-notification", notification);
        }

        return notification;
    } catch (error) {
        console.error("Failed to create notification:", error);
        throw error;
    }
};
