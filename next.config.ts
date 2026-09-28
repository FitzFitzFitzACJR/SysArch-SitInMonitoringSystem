import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/Node-only packages that must not be bundled.
  serverExternalPackages: ["@node-rs/argon2", "pg"],
};

export default nextConfig;
