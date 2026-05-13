"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import {
  useGetModeQuery,
  useSetModeMutation,
  type AppMode,
} from "@/store/slices/modeApiSlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODE_PROMPT_KEY = "modePromptShown";

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getModeConfig(mode: AppMode | null) {
  if (mode === "onsite") {
    return {
      label: "On-site",
      icon: MapPin,
      className:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-500",
    };
  }
  return {
    label: "Off-site",
    icon: Wifi,
    className:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    dotClass: "bg-sky-500",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ModeToggle() {
  const user = useAppSelector((state) => state.auth.user);

  const {
    data: modeData,
    isLoading: modeLoading,
    isFetching: modeFetching,
  } = useGetModeQuery(undefined, {
    // Always hit the server on mount so SPA navigation after login
    // never reads stale cached mode data.
    refetchOnMountOrArgChange: true,
  });
  const [setModeMutation, { isLoading: isSettingMode }] = useSetModeMutation();

  const currentMode: AppMode | null = modeData?.data?.mode ?? null;
  const modeResolving = modeLoading || modeFetching;

  const [pendingMode, setPendingMode] = useState<AppMode | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchLocation = useCallback(async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });
      
      const { latitude: lat, longitude: lng } = position.coords;
      const loc = { lat, lng, name: "" };
      setLocation(loc);

      // Fetch location name using Nominatim (OpenStreetMap)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          {
            headers: {
              "User-Agent": "PowerApp/1.0",
            },
          }
        );
        const data = await res.json();
        if (data && data.display_name) {
          setLocation({ ...loc, name: data.display_name });
        }
      } catch (err) {
        console.error("Failed to fetch location name:", err);
      }
    } catch (err) {
      console.error("Geolocation failed:", err);
      toast.error("Could not get precise location.");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Show prompt if no mode is set.
  // We wait for the fresh fetch to settle.
  useEffect(() => {
    if (modeResolving || !user) return;
    if (currentMode === null) {
      setShowLoginPrompt(true);
    } else {
      setShowLoginPrompt(false);
    }
  }, [modeResolving, currentMode, user]);

  // Fetch location when a modal opens
  useEffect(() => {
    if (showConfirm || showLoginPrompt) {
      fetchLocation();
    }
  }, [showConfirm, showLoginPrompt, fetchLocation]);

  const applyMode = useCallback(
    async (mode: AppMode) => {
      try {
        await setModeMutation({ mode, location: location || undefined }).unwrap();
        toast.success(
          `Mode switched to ${mode === "onsite" ? "On-site" : "Off-site"}`
        );
      } catch {
        toast.error("Failed to update mode. Please try again.");
      }
    },
    [setModeMutation, location]
  );

  const handleLoginModeSelect = async (mode: AppMode) => {
    setShowLoginPrompt(false);
    await applyMode(mode);
  };

  const handleToggleClick = () => {
    const next: AppMode = currentMode === "onsite" ? "offsite" : "onsite";
    setPendingMode(next);
    setShowConfirm(true);
  };

  const handleConfirmToggle = async () => {
    setShowConfirm(false);
    if (pendingMode) {
      await applyMode(pendingMode);
      setPendingMode(null);
    }
  };

  const handleCancelToggle = () => {
    setShowConfirm(false);
    setPendingMode(null);
  };

  const modeConfig = getModeConfig(currentMode);
  const ModeIcon = modeConfig.icon;

  const pendingModeConfig = pendingMode ? getModeConfig(pendingMode) : null;
  const PendingModeIcon = pendingModeConfig?.icon;

  return (
    <>
      {/* ── Pill toggle button ── */}
      {!modeResolving && (
        <button
          id="mode-toggle-btn"
          onClick={handleToggleClick}
          disabled={isSettingMode}
          title={`Current mode: ${modeConfig.label}. Click to switch.`}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all duration-200 hover:opacity-80 disabled:opacity-50 ${modeConfig.className}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${modeConfig.dotClass}`} />
          <ModeIcon className="h-3 w-3" />
          <span className="hidden sm:inline">{modeConfig.label}</span>
        </button>
      )}

      {/* ── Login-time mode selection dialog ── */}
      <Dialog
        open={showLoginPrompt}
        onOpenChange={() => {/* non-dismissible: only closed by picking a mode */ }}
      >
        <DialogContent
          id="login-mode-dialog"
          className="sm:max-w-md"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Select Your Work Mode
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Let us know where you&apos;re working from today. You can change
              this at any time from the header.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {/* On-site card */}
            <button
              id="login-mode-onsite-btn"
              onClick={() => handleLoginModeSelect("onsite")}
              disabled={isSettingMode || locationLoading || !location}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 text-center transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-500/5 disabled:opacity-50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 transition-transform duration-200 group-hover:scale-110 dark:text-emerald-400">
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-foreground">On-site</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Working at the facility location
                </p>
              </div>
            </button>

            {/* Off-site card */}
            <button
              id="login-mode-offsite-btn"
              onClick={() => handleLoginModeSelect("offsite")}
              disabled={isSettingMode || locationLoading || !location}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 text-center transition-all duration-200 hover:border-sky-500 hover:bg-sky-500/5 disabled:opacity-50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 transition-transform duration-200 group-hover:scale-110 dark:text-sky-400">
                <Wifi className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Off-site</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Working remotely
                </p>
              </div>
            </button>
          </div>

          <div className="border-t pt-3 mt-1 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase">Location</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={fetchLocation}
                disabled={locationLoading}
              >
                {locationLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            {location ? (
              <p className="text-xs text-foreground">
                {location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {locationLoading ? "Fetching location..." : "Location not available"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Toggle confirmation dialog ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent id="mode-confirm-dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Switch Work Mode?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You are about to switch from{" "}
              <span className="font-medium text-foreground">
                {currentMode === "onsite" ? "On-site" : "Off-site"}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {pendingMode === "onsite" ? "On-site" : "Off-site"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {pendingModeConfig && PendingModeIcon && (
            <div
              className={`mx-auto flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${pendingModeConfig.className}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${pendingModeConfig.dotClass}`}
              />
              <PendingModeIcon className="h-4 w-4" />
              {pendingModeConfig.label}
            </div>
          )}

          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase">Location</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={fetchLocation}
                disabled={locationLoading}
              >
                {locationLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            {location ? (
              <p className="text-xs text-foreground">
                {location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {locationLoading ? "Fetching location..." : "Location not available"}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              id="mode-confirm-cancel-btn"
              variant="outline"
              onClick={handleCancelToggle}
              disabled={isSettingMode}
            >
              Cancel
            </Button>
            <Button
              id="mode-confirm-apply-btn"
              onClick={handleConfirmToggle}
              disabled={isSettingMode || locationLoading || !location}
            >
              {isSettingMode ? "Switching..." : locationLoading ? "Fetching Location..." : !location ? "Location Required" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
