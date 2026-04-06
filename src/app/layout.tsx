import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "A tiny GitHub-style habit tracker for two people.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Habit Tracker",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
