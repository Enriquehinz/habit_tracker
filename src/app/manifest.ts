import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Habit Tracker",
    short_name: "Habits",
    description: "A calm GitHub-style habit tracker for two people.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f7f2",
    theme_color: "#08110d",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
