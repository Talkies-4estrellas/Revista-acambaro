import { NextResponse } from "next/server";
import { ErrorAdmin, adminPermitido, verificarPeticion } from "@/lib/admin";
import { guardarPlantilla, listarPlantillas } from "@/lib/plantillas";

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}

/** GET → plantillas guardadas. */
export async function GET(req: Request) {
  try {
    if (!adminPermitido(req.headers.get("host"))) throw new ErrorAdmin("No encontrado", 404);
    return NextResponse.json({ plantillas: listarPlantillas() });
  } catch (e) {
    return responderError(e);
  }
}

/** POST { nombre, pagina } → guarda una página como plantilla. */
export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const b = await req.json();
    return NextResponse.json({ plantilla: guardarPlantilla(b.nombre, b.pagina) });
  } catch (e) {
    return responderError(e);
  }
}
