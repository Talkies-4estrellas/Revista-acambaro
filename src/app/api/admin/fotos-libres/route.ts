import { NextResponse } from "next/server";
import { ErrorAdmin, adminPermitido, verificarId, verificarPeticion } from "@/lib/admin";
import { buscarFotosLibres, descargarFotoLibre } from "@/lib/fotos-libres";

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}

/** GET /api/admin/fotos-libres?q=locomotora → fotos de Wikimedia Commons con licencia reutilizable. */
export async function GET(req: Request) {
  try {
    if (!adminPermitido(req.headers.get("host"))) throw new ErrorAdmin("No encontrado", 404);
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return NextResponse.json({ fotos: await buscarFotosLibres(q) }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return responderError(e);
  }
}

/** POST { titulo, edicion } → descarga la foto a /media/<edición>/ y devuelve { src, credito }. Solo con un clic del usuario en «Usar». */
export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const b = await req.json();
    return NextResponse.json(await descargarFotoLibre(String(b.titulo ?? ""), verificarId(String(b.edicion ?? ""))));
  } catch (e) {
    return responderError(e);
  }
}
