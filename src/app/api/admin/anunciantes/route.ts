import { NextResponse } from "next/server";
import { verificarPeticion } from "@/lib/admin";
import { crearAnunciante, leerAnunciantes, responderError } from "@/lib/anunciantes-api";

/** Lista de anunciantes (content/anunciantes.json, privado). */
export async function GET(req: Request) {
  try {
    verificarPeticion(req);
    return NextResponse.json({ anunciantes: leerAnunciantes() }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return responderError(e);
  }
}

/** POST { nombre, contacto?, notas?, vence?, anuncios: [{edicion, pagina}], enlaces: [] } → crea un anunciante. */
export async function POST(req: Request) {
  try {
    verificarPeticion(req);
    return NextResponse.json({ anunciante: crearAnunciante(await req.json()) });
  } catch (e) {
    return responderError(e);
  }
}
