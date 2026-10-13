import { NextResponse } from "next/server";
import { quitarPorToken } from "@/lib/suscriptores";

/** Baja del newsletter con el token personal del enlace del correo. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) {
    let oh = "";
    try {
      oh = new URL(origin).host;
    } catch {}
    if (oh !== req.headers.get("host")) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }
  let token = "";
  try {
    token = String((await req.json()).token ?? "");
  } catch {}
  try {
    return NextResponse.json({ ok: quitarPorToken(token) });
  } catch {
    return NextResponse.json({ error: "No pudimos procesar la baja. Inténtalo más tarde." }, { status: 503 });
  }
}
