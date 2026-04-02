"use client";

import { Search, User, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useMyPresence } from "@/hooks/useMyPresence";
import { usePresenceMap } from "@/hooks/presenceMap";
import { socket } from "@/lib/socket";
import { toastHandler } from "@/lib/toast";

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

  const handleProfile = () => {
    if (user?._id) {
      router.push(`/profile/${user._id}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await toastHandler({
        action: async () => {
          socket.emit("user-offline");
          socket.disconnect();
          await userLogout().unwrap();
          dispatch(logout());
        },
        loading: "Signing out...",
        success: "Signed out successfully",
      });

      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="shrink-0 text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        <div className="flex flex-col">
          <h1 className="text-base font-semibold text-foreground sm:text-lg">
            {title}
          </h1>

          {subtitle && (
            <p className="hidden text-sm text-muted-foreground sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-48 bg-secondary pl-9 xl:w-64"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>

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
                            : "bg-gray-400"
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
