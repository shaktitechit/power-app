"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const FONT_SCALE_KEY = "app-font-scale";
const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.1;
const FONT_SCALE_STEP = 0.05;
const DEFAULT_FONT_SCALE = 1;

type FontScaleContextValue = {
  scale: number;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
  canIncrease: boolean;
  canDecrease: boolean;
};

const FontScaleContext = createContext<FontScaleContextValue | null>(null);

function clampScale(value: number) {
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value));
}

function normalizeScale(value: number) {
  return Number(clampScale(value).toFixed(2));
}

function applyScaleToRoot(scale: number) {
  document.documentElement.style.setProperty("--app-font-scale", String(scale));
}

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(DEFAULT_FONT_SCALE);

  useEffect(() => {
    const raw = window.localStorage.getItem(FONT_SCALE_KEY);
    const parsed = raw ? Number(raw) : DEFAULT_FONT_SCALE;
    const nextScale = Number.isFinite(parsed) ? normalizeScale(parsed) : DEFAULT_FONT_SCALE;
    setScale(nextScale);
    applyScaleToRoot(nextScale);
  }, []);

  useEffect(() => {
    applyScaleToRoot(scale);
    window.localStorage.setItem(FONT_SCALE_KEY, String(scale));
  }, [scale]);

  const increase = useCallback(() => {
    setScale((prev) => normalizeScale(prev + FONT_SCALE_STEP));
  }, []);

  const decrease = useCallback(() => {
    setScale((prev) => normalizeScale(prev - FONT_SCALE_STEP));
  }, []);

  const reset = useCallback(() => {
    setScale(DEFAULT_FONT_SCALE);
  }, []);

  const value = useMemo(
    () => ({
      scale,
      increase,
      decrease,
      reset,
      canIncrease: scale < MAX_FONT_SCALE,
      canDecrease: scale > MIN_FONT_SCALE,
    }),
    [scale, increase, decrease, reset],
  );

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

export function useFontScale() {
  const context = useContext(FontScaleContext);
  if (!context) {
    throw new Error("useFontScale must be used within FontScaleProvider");
  }
  return context;
}
