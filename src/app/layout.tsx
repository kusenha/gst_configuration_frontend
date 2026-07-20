import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeInit } from "./theme-init";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GST Configuration",
  description: "Central configuration console for SMTP, SMS, email templates, and integrations.",
  icons: {
    icon: "/logo/gst.png",
  },
};

// Runs before hydration so the .dark class is set before first paint —
// without this the page would flash light-then-dark for users who chose
// dark (or whose OS prefers it) on every load.
const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem("gst-config-theme");var theme="system";if(raw){theme=(JSON.parse(raw).state||{}).theme||"system"}var isDark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(isDark)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
