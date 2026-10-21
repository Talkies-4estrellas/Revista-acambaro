import { NextResponse } from "next/server";
import { ErrorAdmin, leerRespaldo, listarRespaldos, verificarPeticion } from "@/lib/admin";

/** Versiones anteriores de una edición: sin parámetros, la lista; con ?nombre=…, el contenido de esa versión. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    const nombre = new URL(req.url).searchParams.get("nombre");
    if (nombre) return NextResponse.json({ datos: leerRespaldo(id, nombre) });
    return NextResponse.json({ respaldos: listarRespaldos(id) });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}
