import { NextResponse } from "next/server";
import { ErrorAdmin, leerCrudo, listarEdicionesAdmin, verificarPeticion } from "@/lib/admin";

/** Datos del buscador rápido (Ctrl+K): cada edición con su número y los títulos de sus páginas. */
export async function GET(req: Request) {
  try {
    verificarPeticion(req);
    const ediciones = listarEdicionesAdmin()
      .filter((e) => !e.error)
      .map((e) => ({
        id: e.id,
        numero: e.muestra ? null : (e.numero ?? null),
        tema: e.tema ?? e.id,
        paginas: (leerCrudo(e.id)?.paginas ?? []).map((p) => p.titulo ?? ""),
      }));
    return NextResponse.json({ ediciones }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}
