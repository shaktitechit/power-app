"use client";

import { useCallback, useEffect, useRef } from "react";
import { User, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useLogoutMutation } from "@/store/slices/userApiSlice";
import { logout } from "@/store/slices/authSlice";
import { usePresenceMap } from "@/hooks/presenceMap";
import { socket } from "@/lib/socket";
import { toastHandler } from "@/lib/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { FontSizeControl } from "@/components/font-size-control";
import { toast } from "sonner";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({
  title = "Dashboard",
  subtitle,
  onMenuClick,
}: HeaderProps) {
  const user = useAppSelector((state) => state.auth.user);

  // read presence map
  const presenceMap = usePresenceMap();

  // get current user status
  const status = presenceMap[user?._id] || "offline";

  const router = useRouter();
  const dispatch = useAppDispatch();

  const [userLogout, { isLoading }] = useLogoutMutation();
  const isForceLoggingOutRef = useRef(false);

  const clearClientStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.clear();
    sessionStorage.clear();
  };

  const runLogoutFlow = useCallback(async ({
    isForced = false,
    showSuccessToast = true,
  }: {
    isForced?: boolean;
    showSuccessToast?: boolean;
  } = {}) => {
    if (isForceLoggingOutRef.current) return;
    isForceLoggingOutRef.current = true;

    try {
      if (!isForced) {
        socket.emit("user-offline");
      }
      socket.disconnect();

      // Server logout clears auth cookies. Proceed with client cleanup even if it fails.
      try {
        await userLogout().unwrap();
      } catch (apiError) {
        console.error("Logout API failed", apiError);
      }

      dispatch(logout());
      clearClientStorage();

      if (showSuccessToast) {
        toast.success(
          isForced
            ? "Logged out due to inactivity."
            : "Signed out successfully",
        );
      }

      router.push("/login");
    } finally {
      isForceLoggingOutRef.current = false;
    }
  }, [dispatch, router, userLogout]);

  const handleProfile = () => {
    if (user?._id) {
      router.push(`/profile/${user._id}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await toastHandler({
        action: async () => runLogoutFlow({ showSuccessToast: false }),
        loading: "Signing out...",
        success: "Signed out successfully",
      });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const handleForceLogout = async () => {
      toast.error("Session expired due to inactivity (10 minutes).");
      await runLogoutFlow({ isForced: true, showSuccessToast: false });
    };

    socket.on("force-logout", handleForceLogout);
    return () => {
      socket.off("force-logout", handleForceLogout);
    };
  }, [runLogoutFlow]);

  function getInitials(name?: string | null) {
    if (!name) return "U";

    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";

    return parts
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16 sm:gap-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        <div className="min-w-0 flex flex-col">
          <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
            {title}
          </h1>

          {subtitle && (
            <p className="hidden truncate text-sm text-muted-foreground sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-3 md:gap-4">
        <div className="hidden md:flex">
          <FontSizeControl />
        </div>
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              {user && (
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {user.name}

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        status === "online"
                          ? "bg-green-500"
                          : status === "away"
                            ? "bg-yellow-400"
                            : "bg-muted-foreground"
                      }`}
                    />
                  </span>

                  <span className="text-xs capitalize text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              )}

              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleProfile}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isLoading}
              className="text-destructive"
            >
              {isLoading ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
