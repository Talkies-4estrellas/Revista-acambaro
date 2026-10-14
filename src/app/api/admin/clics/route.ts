import { NextResponse } from "next/server";
import { adminPermitido } from "@/lib/admin";
import { clicsCsv, leerClics } from "@/lib/clics";

/** GET → CSV con los clics por enlace (solo en el equipo de quien publica). */
export async function GET(req: Request) {
  if (!adminPermitido(req.headers.get("host"))) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return new NextResponse(clicsCsv(leerClics()), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="clics.csv"' },
  });
}
