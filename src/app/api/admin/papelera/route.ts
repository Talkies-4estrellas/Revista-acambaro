import { NextResponse } from "next/server";
import { ErrorAdmin, verificarPeticion } from "@/lib/admin";
import { listarPapelera, recuperarEdicion, recuperarMedio } from "@/lib/admin-extra";

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}

/** Lo que hay en la papelera (ediciones y medios). */
export async function GET(req: Request) {
  try {
    verificarPeticion(req);
    return NextResponse.json({ papelera: listarPapelera() }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return responderError(e);
  }
}

/** POST { tipo: "edicion" | "medio", archivo } → lo recupera. Devuelve { id } o { src }. */
export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const b = await req.json();
    const archivo = String(b.archivo ?? "");
    if (b.tipo === "edicion") return NextResponse.json({ id: recuperarEdicion(archivo) });
    if (b.tipo === "medio") return NextResponse.json({ src: recuperarMedio(archivo) });
    throw new ErrorAdmin("Tipo no válido.");
  } catch (e) {
    return responderError(e);
  }
}
