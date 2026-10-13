import { NextResponse } from "next/server";
import { ErrorAdmin, crearEdicion, verificarId, verificarPeticion } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const b = await req.json();
    const id = verificarId(String(b.id ?? ""));
    crearEdicion(
      id,
      { numero: "", fecha: String(b.fecha ?? ""), tema: String(b.tema ?? "") },
      b.duplicarDe ? String(b.duplicarDe) : undefined,
    );
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return responderError(e);
  }
}

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}
