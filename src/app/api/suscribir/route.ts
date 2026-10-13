import { NextResponse } from "next/server";
import { agregarSuscriptor, normalizarEmail } from "@/lib/suscriptores";

/** Alta pública al newsletter. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) {
    let oh = "";
    try {
      oh = new URL(origin).host;
    } catch {}
    if (oh !== req.headers.get("host")) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  let b: Record<string, unknown> = {};
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
  }
  // Campo trampa para bots: un humano no lo ve ni lo llena. Se responde "ok" sin guardar nada.
  if (typeof b.web === "string" && b.web !== "") return NextResponse.json({ ok: true });

  const email = normalizarEmail(b.email);
  if (!email) return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });

  try {
    await agregarSuscriptor(email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No pudimos guardar tu correo. Inténtalo más tarde." }, { status: 503 });
  }
}
