import { NextResponse } from "next/server";
import { ErrorAdmin, borrarBorrador, guardarEdicion, marcaEdicion, verificarPeticion } from "@/lib/admin";

/** Marca de la última modificación de la edición (el editor la consulta para avisar de cambios hechos en otra pestaña). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    return NextResponse.json({ marca: marcaEdicion(id) }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}

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
    // x-marca: lo último que el editor vio del archivo; con ?forzar=1 se guarda encima de todos modos.
    const forzar = new URL(req.url).searchParams.get("forzar") === "1";
    const base = Number(req.headers.get("x-marca"));
    const marca = guardarEdicion(id, await req.json(), forzar || !Number.isFinite(base) || base <= 0 ? null : base);
    return NextResponse.json({ ok: true, marca });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message, ...(e.status === 409 ? { conflicto: true } : {}) }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}
