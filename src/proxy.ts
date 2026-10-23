import { NextResponse, type NextRequest } from "next/server";
import { adminPermitido, esRutaAdmin } from "@/lib/admin-acceso";

/**
 * Primera muralla del panel de administración: cualquier ruta /admin o /api/admin que no venga de una máquina autorizada recibe un
 * 404 antes de llegar a su código. Es independiente de las comprobaciones de cada ruta (que siguen ahí), de modo que una ruta de
 * administración nueva a la que se le olvide el guardia igual queda cerrada en el sitio publicado.
 * Ver Doc/protocolo-admin.md.
 */
export function proxy(req: NextRequest) {
  if (esRutaAdmin(req.nextUrl.pathname) && !adminPermitido(req.headers.get("host"))) {
    return new NextResponse("No encontrado", { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"] };
