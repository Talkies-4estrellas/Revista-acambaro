import { NextResponse } from "next/server";
import { getEdiciones } from "@/lib/ediciones";
import { ErrorAdmin, crearEdicion, crearResumen, verificarId, verificarPeticion } from "@/lib/admin";

/** Lista corta de ediciones (para elegir a cuál lleva un enlace). */
export async function GET(req: Request) {
  try {
    verificarPeticion(req);
    const lista = getEdiciones().map((e) => ({ id: e.id, numero: e.numero, tema: e.tema, paginas: e.paginas.length, publicada: e.publicada }));
    return NextResponse.json({ ediciones: lista });
  } catch (e) {
    return responderError(e);
  }
}

export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    const b = await req.json();
    const id = verificarId(String(b.id ?? ""));
    if (b.resumen) {
      const indices = Array.isArray(b.resumen.paginas) ? b.resumen.paginas.map(Number) : [];
      const avisos = crearResumen(id, { fecha: String(b.fecha ?? ""), tema: String(b.tema ?? "") }, verificarId(String(b.resumen.origen ?? "")), indices);
      return NextResponse.json({ ok: true, id, avisos });
    }
    crearEdicion(
      id,
      { numero: "", fecha: String(b.fecha ?? ""), tema: String(b.tema ?? "") },
      b.duplicarDe ? String(b.duplicarDe) : undefined,
      Array.isArray(b.secciones) ? b.secciones.map(String) : undefined,
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
