import { NextResponse } from "next/server";
import { verificarPeticion } from "@/lib/admin";
import { actualizarAnunciante, borrarAnunciante } from "@/lib/anunciantes";
import { responderError } from "@/lib/anunciantes-api";

/** PUT → guarda los cambios de un anunciante. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    return NextResponse.json({ anunciante: actualizarAnunciante(id, await req.json()) });
  } catch (e) {
    return responderError(e);
  }
}

/** DELETE → quita el anunciante del registro (sus anuncios en las ediciones no se tocan). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    verificarPeticion(req);
    const { id } = await params;
    borrarAnunciante(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return responderError(e);
  }
}
