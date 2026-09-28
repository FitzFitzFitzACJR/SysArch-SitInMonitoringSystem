import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/Node-only packages that must not be bundled.
  serverExternalPackages: ["@node-rs/argon2", "pg", "sharp", "exceljs", "pdfkit"],
  logging: {
    // Dev-only call logging prints every action argument, including passwords and reset
    // tokens, to the terminal. Off.
    serverFunctions: false,
  },
  experimental: {
    serverActions: {
      // Profile photos (≤ 5 MB) and bulk-import spreadsheets are uploaded through server actions.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
