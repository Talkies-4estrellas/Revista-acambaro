import { NextResponse } from "next/server";
import { ErrorAdmin, borrarBorrador, guardarEdicion, verificarPeticion } from "@/lib/admin";

/** Borra un borrador (pasa a content/papelera). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    borrarBorrador(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    guardarEdicion(id, await req.json());
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}
