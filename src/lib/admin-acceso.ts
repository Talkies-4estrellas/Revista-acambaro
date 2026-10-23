/**
 * Quién puede usar el panel de administración. Es la ÚNICA regla de acceso: la usan la capa de entrada (src/proxy.ts), el
 * layout de /admin y cada ruta de /api/admin (a través de verificarPeticion en lib/admin.ts). No importa nada pesado (ni fs ni sharp)
 * para poder usarse en el proxy.
 *
 * Protocolo completo en Doc/protocolo-admin.md.
 */
export function adminPermitido(host: string | null | undefined): boolean {
  // Tope duro: en Vercel el panel NUNCA está disponible, sin importar las variables de entorno. Así, un ADMIN_ENABLED o un
  // ADMIN_ALLOW_REMOTE puesto por descuido en el panel de Vercel no lo abre.
  if (process.env.VERCEL || process.env.VERCEL_ENV) return false;
  // Una compilación de producción tampoco lo activa sola: hace falta ADMIN_ENABLED=true (solo para pruebas locales de `next start`).
  if (process.env.NODE_ENV === "production" && process.env.ADMIN_ENABLED !== "true") return false;
  // En la red local solo con ADMIN_ALLOW_REMOTE=true (no recomendado); por omisión, únicamente desde esta misma máquina.
  if (process.env.ADMIN_ALLOW_REMOTE === "true") return true;
  const nombre = (host ?? "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return nombre === "localhost" || nombre === "127.0.0.1" || nombre === "::1";
}

/** Rutas que son del panel: las páginas /admin y la API /api/admin. */
export const esRutaAdmin = (ruta: string) => ruta === "/admin" || ruta.startsWith("/admin/") || ruta === "/api/admin" || ruta.startsWith("/api/admin/");
