import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "동행 — 아웃리치 플랫폼",
    short_name: "동행",
    description: "교회 단기선교/아웃리치 팀을 위한 플랫폼",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#1a1917",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
