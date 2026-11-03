import { NextResponse } from "next/server";
import { ErrorAdmin } from "./admin";
import { ErrorAnunciante } from "./anunciantes";

export { crearAnunciante, leerAnunciantes } from "./anunciantes";

/** Respuesta de error de las rutas /api/admin/anunciantes. */
export function responderError(e: unknown) {
  if (e instanceof ErrorAdmin || e instanceof ErrorAnunciante) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}
