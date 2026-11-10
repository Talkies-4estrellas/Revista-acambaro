import { NextResponse } from "next/server";
import { estadosDeCupones } from "@/lib/cupones-publicos";

/**
 * Estado actual de los cupones de AcambaGo que aparecen en una página: GET /api/cupones/estado?ids=<id>,<id>
 * Lo consulta el servidor de la revista (no el navegador del lector) y pide a AcambaGo solo estos datos; se guarda 5 minutos.
 * Si un cupón ya no sirve, puede traer otro vigente del mismo negocio (`sustituto`). Sin conexión responde vacío y la página usa lo guardado.
 */
const CACHE = "public, s-maxage=300, stale-while-revalidate=600";

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",");
  try {
    return NextResponse.json({ estados: await estadosDeCupones(ids) }, { headers: { "Cache-Control": CACHE } });
  } catch {
    return NextResponse.json({ estados: {} }, { headers: { "Cache-Control": "public, s-maxage=60" } });
  }
}
