import type { MetadataRoute } from "next";

// Makes the app installable ("Add to home screen"), so students can open their QR code
// like a native app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CCS Sit-In Monitoring",
    short_name: "CCS Sit-In",
    description: "Lab sit-ins, reservations and your check-in QR code.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#2a78d6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
