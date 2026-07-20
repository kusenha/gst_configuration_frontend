"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/store/theme";

const NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const LABEL: Record<Theme, string> = { light: "Light theme", dark: "Dark theme", system: "System theme" };

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const Icon = ICON[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      title={`${LABEL[theme]} — click to switch`}
      className="grid h-9 w-9 place-items-center rounded-md text-foreground/80 hover:bg-muted"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
