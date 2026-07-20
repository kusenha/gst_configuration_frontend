"use client";

import { useEffect } from "react";
import { applyTheme, useTheme } from "@/store/theme";

export function ThemeInit() {
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(theme);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}
