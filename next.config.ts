import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite compilar a otra carpeta sin tocar el .next del servidor de desarrollo.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
