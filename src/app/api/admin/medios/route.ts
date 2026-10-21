import { NextResponse } from "next/server";
import { ErrorAdmin, adminPermitido, guardarMedio, listarMedios, verificarId, verificarPeticion } from "@/lib/admin";

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}

/** GET /api/admin/medios?edicion=02 → rutas de los archivos subidos a esa edición. */
export async function GET(req: Request) {
  try {
    if (!adminPermitido(req.headers.get("host"))) throw new ErrorAdmin("No encontrado", 404);
    const id = verificarId(new URL(req.url).searchParams.get("edicion") ?? "");
    return NextResponse.json({ medios: listarMedios(id) });
  } catch (e) {
    return responderError(e);
  }
}

/** POST multipart: campos `edicion` y `archivo` (y `original=1` para no optimizar la foto). Devuelve { src, optimizado? }. */
export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const form = await req.formData();
    const id = verificarId(String(form.get("edicion") ?? ""));
    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new ErrorAdmin("Falta el archivo.");
    // `original=1` conserva el archivo tal cual (sin reducir ni recomprimir).
    return NextResponse.json(await guardarMedio(id, archivo, form.get("original") === "1"));
  } catch (e) {
    return responderError(e);
  }
}
