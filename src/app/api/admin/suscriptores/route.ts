import { NextResponse } from "next/server";
import { ErrorAdmin, verificarPeticion } from "@/lib/admin";
import { leerSuscriptores, normalizarEmail, quitarPorEmail, suscriptoresCsv } from "@/lib/suscriptores";

function responderError(e: unknown) {
  if (e instanceof ErrorAdmin) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 });
}

/** CSV de suscriptores (email, fecha de alta y enlace de baja personal). ?base=https://tu-sitio.com */
export async function GET(req: Request) {
  try {
    verificarPeticion(req);
    const base = (new URL(req.url).searchParams.get("base") ?? "").replace(/\/+$/, "");
    if (base && !/^https?:\/\/[^\s]+$/.test(base)) throw new ErrorAdmin("La dirección del sitio no es válida.");
    return new Response("﻿" + suscriptoresCsv(leerSuscriptores(), base), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="suscriptores.csv"',
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return responderError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    verificarPeticion(req);
    const email = normalizarEmail((await req.json()).email);
    if (!email) throw new ErrorAdmin("Correo no válido.");
    if (!quitarPorEmail(email)) throw new ErrorAdmin("Ese correo no está en la lista.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return responderError(e);
  }
}
