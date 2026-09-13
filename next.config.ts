import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local builds can use a separate output dir so a dev server in the same folder cannot clobber them.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@libsql/client", "@libsql/core", "@libsql/hrana-client", "@libsql/isomorphic-ws", "@libsql/isomorphic-fetch", "libsql", "nodemailer"],
  images: { formats: ["image/webp"] },
};

export default nextConfig;
