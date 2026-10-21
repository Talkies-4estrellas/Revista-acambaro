import { NextResponse } from "next/server";
import { ErrorAdmin, adminPermitido, verificarPeticion } from "@/lib/admin";
import { guardarElemento, listarElementos } from "@/lib/elementos-guardados";

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}

/** GET → «Mis elementos» guardados. */
export async function GET(req: Request) {
  try {
    if (!adminPermitido(req.headers.get("host"))) throw new ErrorAdmin("No encontrado", 404);
    return NextResponse.json({ elementos: listarElementos() });
  } catch (e) {
    return responderError(e);
  }
}

/** POST { nombre, elementos } → guarda los elementos como un grupo reutilizable. */
export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const b = await req.json();
    return NextResponse.json({ elemento: guardarElemento(b.nombre, b.elementos) });
  } catch (e) {
    return responderError(e);
  }
}
