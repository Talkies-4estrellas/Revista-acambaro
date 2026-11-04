import { NextResponse } from "next/server";
import { ErrorAdmin, verificarPeticion } from "@/lib/admin";
import { ErrorAjustes, guardarAjustes } from "@/lib/ajustes";

/** POST { cambios: { CLAVE: "valor" | "" } } → escribe esos ajustes en .env.local (solo los editables; "" la quita). */
export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const b = await req.json();
    if (!b || typeof b.cambios !== "object" || Array.isArray(b.cambios)) throw new ErrorAjustes("Faltan los cambios.");
    guardarAjustes(b.cambios);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ErrorAjustes) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}
