import { NextResponse } from "next/server";
import { ErrorAdmin, verificarPeticion } from "@/lib/admin";
import { borrarPlantilla, renombrarPlantilla } from "@/lib/plantillas";

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}

/** PUT { nombre } → renombra. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    renombrarPlantilla(id, (await req.json()).nombre);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return responderError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    borrarPlantilla(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return responderError(e);
  }
}
