import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libsql ships a native client; keep it external to the server bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
