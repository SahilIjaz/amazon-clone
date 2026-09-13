import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "@libsql/core", "@libsql/hrana-client", "@libsql/isomorphic-ws", "@libsql/isomorphic-fetch", "libsql", "nodemailer"],
  images: { formats: ["image/webp"] },
};

export default nextConfig;
