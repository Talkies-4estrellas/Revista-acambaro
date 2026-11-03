import { NextResponse } from "next/server";
import { ErrorAdmin, verificarPeticion } from "@/lib/admin";
import { cambiarPublicacion, type ModoPublicacion } from "@/lib/admin-extra";

/** POST { modo: "publicar" | "programar" | "desactivar", publicarEn? } → cambia la publicación sin abrir el editor. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    const b = await req.json();
    if (!["publicar", "programar", "desactivar"].includes(b.modo)) throw new ErrorAdmin("Acción no válida.");
    const marca = cambiarPublicacion(id, b.modo as ModoPublicacion, typeof b.publicarEn === "string" ? b.publicarEn : undefined);
    return NextResponse.json({ ok: true, marca });
  } catch (e) {
    if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
  }
}
