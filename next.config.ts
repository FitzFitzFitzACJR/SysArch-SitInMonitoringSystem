import type { NextConfig } from "next";

// Sent with every response. (A strict Content-Security-Policy would need per-request
// nonces for Next's inline scripts; uploaded files get their own sandbox CSP instead.)
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }, // no clickjacking via iframes
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera only for this site (QR scanning); nothing else.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  // Browsers ignore this over plain http (local dev); it pins https once deployed.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Native/Node-only packages that must not be bundled.
  serverExternalPackages: ["@node-rs/argon2", "pg", "sharp", "exceljs", "pdfkit"],
  logging: {
    // Dev-only call logging prints every action argument, including passwords and reset
    // tokens, to the terminal. Off.
    serverFunctions: false,
  },
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Profile photos (≤ 5 MB) and bulk-import spreadsheets are uploaded through server actions.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
