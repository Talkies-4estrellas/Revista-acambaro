import fs from "node:fs";
import path from "node:path";
import { ErrorAdmin, TIPOS_MEDIO, adminPermitido } from "@/lib/admin";
import { rutaEnPapeleraMedios } from "@/lib/admin-extra";

/** GET ?archivo=… → la imagen de un archivo que está en la papelera de medios (para verla antes de recuperarla). */
export async function GET(req: Request) {
  try {
    if (!adminPermitido(req.headers.get("host"))) throw new ErrorAdmin("No encontrado", 404);
    const ruta = rutaEnPapeleraMedios(new URL(req.url).searchParams.get("archivo") ?? "");
    const tipo = TIPOS_MEDIO[path.extname(ruta).slice(1).toLowerCase()] ?? "application/octet-stream";
    return new Response(fs.readFileSync(ruta), { headers: { "content-type": tipo, "cache-control": "no-store", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'", "x-content-type-options": "nosniff" } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Error", { status: e instanceof ErrorAdmin ? e.status : 500 });
  }
}
