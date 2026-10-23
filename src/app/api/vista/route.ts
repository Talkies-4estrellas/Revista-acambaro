import { NextResponse } from "next/server";
import { registrarVista } from "@/lib/vistas";

/** Cuenta la vista de una página de la revista. Siempre responde 204: no debe estorbar a quien lee. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) {
    let oh = "";
    try {
      oh = new URL(origin).host;
    } catch {}
    if (oh !== req.headers.get("host")) return new NextResponse(null, { status: 204 });
  }
  try {
    const b = JSON.parse(await req.text());
    const visitante = `${req.headers.get("x-forwarded-for") ?? ""}|${req.headers.get("user-agent") ?? ""}`.slice(0, 200);
    await registrarVista(b.e, b.n, visitante);
  } catch {
    // Petición mal formada: se ignora.
  }
  return new NextResponse(null, { status: 204 });
}
