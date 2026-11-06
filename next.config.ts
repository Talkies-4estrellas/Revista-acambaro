import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite compilar a otra carpeta sin tocar el .next del servidor de desarrollo.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Las copias adaptadas de las fotos (lib/imagen.ts) se guardan un mes: los archivos de /media no cambian de contenido.
  images: { minimumCacheTTL: 2678400 },
};

export default nextConfig;
