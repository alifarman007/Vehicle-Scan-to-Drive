import type { MetadataRoute } from "next"

import { APP_NAME } from "@/lib/config"
import { strings } from "@/lib/strings"

/**
 * Lets phones add the app to the home screen and open it full screen. No
 * service worker: every screen needs live server data anyway. The icons are
 * rendered from app/icon.svg; the maskable one keeps the mark inside the
 * central 80% so Android's round and squircle masks never clip it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_NAME,
    description: strings.app.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Same zinc-100 as the app canvas and the viewport theme colour.
    background_color: "#f4f4f5",
    theme_color: "#f4f4f5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
