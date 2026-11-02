import { NextResponse, type NextRequest } from "next/server";
import { adminPermitido, esRutaAdmin } from "@/lib/admin-acceso";

/**
 * Primera muralla del panel de administración: cualquier ruta /admin o /api/admin que no venga de una máquina autorizada recibe un
 * 404 antes de llegar a su código. Es independiente de las comprobaciones de cada ruta (que siguen ahí), de modo que una ruta de
 * administración nueva a la que se le olvide el guardia igual queda cerrada en el sitio publicado.
 * Ver Doc/protocolo-admin.md.
 */
/** Quien abre el sitio por primera vez (sin la marca «bienvenida») pasa antes por la presentación; después, directo a la portada. */
const MARCA_BIENVENIDA = "acomdi-bienvenida";
const ES_ROBOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|twitter|linkedin|preview|lighthouse|headless/i;

function primeraVisita(req: NextRequest): NextResponse | null {
  if (req.nextUrl.pathname !== "/" || req.method !== "GET") return null;
  if (req.cookies.has(MARCA_BIENVENIDA)) return null;
  // Solo para personas abriendo la página (no para buscadores ni para las vistas previas de WhatsApp o redes), y se puede saltar con ?inicio.
  if (ES_ROBOT.test(req.headers.get("user-agent") ?? "")) return null;
  const destino = req.headers.get("sec-fetch-dest");
  if (destino && destino !== "document") return null;
  if (req.nextUrl.searchParams.has("inicio")) return null;
  const r = NextResponse.redirect(new URL("/bienvenida", req.url), 307);
  r.cookies.set(MARCA_BIENVENIDA, "1", { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" });
  r.headers.set("cache-control", "no-store");
  return r;
}

export function proxy(req: NextRequest) {
  const bienvenida = primeraVisita(req);
  if (bienvenida) return bienvenida;
  if (esRutaAdmin(req.nextUrl.pathname) && !adminPermitido(req.headers.get("host"))) {
    return new NextResponse("No encontrado", { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"] };
