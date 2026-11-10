import { NextResponse } from "next/server";
import { adminPermitido } from "@/lib/admin";
import { clienteAcambaGo, credencialesAcambaGo, datosDeCupon, estadoCupon, leerCuponesAcambaGo } from "@/lib/cupones-acambago";

/** GET → cupones de AcambaGo para elegir en el editor: id, estado actual y los datos que se guardan en la edición. Solo lectura. */
export async function GET(req: Request) {
  if (!adminPermitido(req.headers.get("host"))) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const cred = credencialesAcambaGo();
  if (!cred) return NextResponse.json({ error: "Falta la conexión con AcambaGo (ACAMBAGO_SUPABASE_URL y ACAMBAGO_SUPABASE_ANON_KEY en .env.local)." }, { status: 503 });
  try {
    const lista = await leerCuponesAcambaGo(clienteAcambaGo(cred.url, cred.clave));
    const ahora = new Date();
    return NextResponse.json({
      cupones: lista.map((c) => ({ id: c.id, estado: estadoCupon(c, ahora), usados: c.used_count, datos: datosDeCupon(c, ahora) })),
    });
  } catch (e) {
    return NextResponse.json({ error: `No se pudo leer AcambaGo: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
  }
}
