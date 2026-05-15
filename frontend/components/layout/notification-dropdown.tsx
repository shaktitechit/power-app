"use client";

import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector } from "@/store/hooks";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/store/slices/notificationApiSlice";
import { socket } from "@/lib/socket";
import { toast } from "sonner";

export function NotificationDropdown() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "super_admin";

  const { data: notificationsData, refetch: refetchNotifications } =
    useGetNotificationsQuery(isSuperAdmin ? { all: true } : undefined, {
      refetchOnMountOrArgChange: true,
    });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount =
    notificationsData?.data.filter((n) =>
      isSuperAdmin ? !n.superAdminRead : !n.isRead
    ).length || 0;

  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      refetchNotifications();
      toast.info(`New Notification: ${notification.title}`);

      // 🎵 Play a subtle notification sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = "sine";
        oscillator.frequency.value = 587.33; // D5 note (friendly tone)
        gainNode.gain.value = 0.05; // Keep it subtle
        
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
        }, 150);
      } catch (error) {
        console.error("Failed to play notification sound", error);
      }
    };

    socket.on("new-notification", handleNewNotification);
    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [refetchNotifications]);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[30rem] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={() => markAllAsRead(isSuperAdmin ? { all: true } : undefined)}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notificationsData?.data.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notificationsData?.data.map((notification) => {
            const isRead = isSuperAdmin
              ? notification.superAdminRead
              : notification.isRead;

            // Personalize message based on viewer perspective
            let displayMessage = notification.message;
            const senderObj = typeof notification.sender === "object" ? notification.sender : null;
            const recipientObj = typeof notification.recipient === "object" ? notification.recipient : null;

            if (senderObj?._id === user?._id) {
              // Viewer is the sender
              displayMessage = notification.message.replace(
                "You have been",
                `You assigned ${recipientObj?.name || "User"}`
              );
            } else if (recipientObj?._id !== user?._id) {
              // Viewer is NEITHER sender nor recipient (e.g. Super Admin viewing global list)
              displayMessage = notification.message.replace(
                "You have been",
                `${senderObj?.name || "System"} assigned ${recipientObj?.name || "User"}`
              );
            }

            return (
              <DropdownMenuItem
                key={notification._id}
                className={`flex flex-col items-start p-3 focus:bg-accent cursor-pointer ${
                  !isRead ? "bg-accent/50" : ""
                }`}
                onClick={() => {
                  if (!isRead) {
                    markAsRead({ id: notification._id, all: isSuperAdmin });
                  }
                }}
              >
                <div className="flex w-full justify-between items-start">
                  <span
                    className={`text-sm font-medium ${
                      !isRead ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {notification.title}
                  </span>
                  {!isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary mt-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {displayMessage}
                </p>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
