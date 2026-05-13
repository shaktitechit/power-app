"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { User, ChevronDown, Menu, Clock } from "lucide-react";
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
import { ModeToggle } from "@/components/mode-toggle";
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
  const presenceMap = usePresenceMap();
  const status = presenceMap[user?._id] || "offline";

  const router = useRouter();
  const dispatch = useAppDispatch();

  const [userLogout, { isLoading }] = useLogoutMutation();
  const isForceLoggingOutRef = useRef(false);
  const lastPingRef = useRef(0);

  const clearClientStorage = () => {
    if (typeof window === "undefined") return;
    localStorage.clear();
    sessionStorage.clear();
  };

  const runLogoutFlow = useCallback(
    async ({
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

        try {
          await userLogout().unwrap();
        } catch (apiError) {
          console.error("Logout API failed", apiError);
        }

        dispatch(logout());
        clearClientStorage();

        if (showSuccessToast) {
          toast.success(
            isForced ? "Logged out due to inactivity." : "Signed out successfully"
          );
        }

        router.push("/login");
      } finally {
        isForceLoggingOutRef.current = false;
      }
    },
    [dispatch, router, userLogout]
  );

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

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10 * 60); //10 minute for testing (matches your backend change)

  useEffect(() => {
    if (!user) {
      runLogoutFlow({ isForced: true, showSuccessToast: false });
      return;
    }

    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    // Try to initialize from cookie if present
    const expiresAtStr = getCookie("sessionTimer");
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      const diff = Math.floor((expiresAt - Date.now()) / 1000);
      if (diff > 0) {
        setSecondsRemaining(diff);
      } else {
        runLogoutFlow({ isForced: true, showSuccessToast: false });
        return;
      }
    } else {
      runLogoutFlow({ isForced: true, showSuccessToast: false });
      return;
    }

    const resetTimer = () => {
      setSecondsRemaining(10 * 60); // Reset to 10 minutes on activity

      const now = Date.now();
      if (now - lastPingRef.current > 60 * 1000) { // 1 minute throttle
        lastPingRef.current = now;
        
        fetch('/api/v1/users/refresh-timer', { 
          method: 'POST',
          credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
          if (data.expiresAt) {
            const diff = Math.floor((data.expiresAt - Date.now()) / 1000);
            if (diff > 0) {
              setSecondsRemaining(diff);
            }
          }
        })
        .catch(err => console.error("Heartbeat failed", err));
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          runLogoutFlow({ isForced: true, showSuccessToast: false });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearInterval(interval);
    };
  }, [runLogoutFlow, user]);

  useEffect(() => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
  }, [secondsRemaining]);

  function getInitials(name?: string | null) {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  const controls = (
    <div className="flex items-center gap-1 sm:gap-1.5 text-xs scale-90 origin-left">
      {timeLeft && (
        <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.2 font-medium text-orange-600 dark:text-orange-400">
          <Clock className="h-3 w-3" />
          <span>{timeLeft}</span>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-1.5">
        <div className="hidden md:flex">
          <FontSizeControl />
        </div>
        <ThemeToggle />
        <ModeToggle />
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16 sm:gap-3 sm:px-6">
      {/* Left: title & subtitle & controls (mobile) */}
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
          <h1 className="truncate text-base font-semibold text-foreground sm:text-sm">
            {title}
          </h1>

          {subtitle && (
            <p className="hidden truncate text-sm text-muted-foreground sm:block">
              {subtitle}
            </p>
          )}

          {/* Controls on mobile (in subtitle space) */}
          <div className="flex items-center gap-1.5 mt-0 sm:hidden">
            {controls}
          </div>
        </div>
      </div>

      {/* Right: Controls (desktop) + User dropdown */}
      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-3 md:gap-4">
        {/* Controls on desktop */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-3 md:gap-4">
          {controls}
        </div>

        {/* User dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex max-w-[14rem] items-center gap-2 px-2 sm:max-w-[18rem]"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              {user && (
                <div className="hidden min-w-0 flex-col items-start text-left md:flex">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="max-w-[10rem] truncate lg:max-w-[12rem]">
                      {user.name}
                    </span>

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${status === "online"
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
