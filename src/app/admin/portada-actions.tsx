"use server";

import type { ReactNode } from "react";
import { headers } from "next/headers";
import PortadaMini from "@/components/PortadaMini";
import { adminPermitido } from "@/lib/admin";
import { getEdicion } from "@/lib/ediciones";

/**
 * Portada en miniatura de una edición (también de borradores) para la lista del panel. Se pide desde el navegador solo cuando la
 * portada aparece en pantalla (ver PortadaPerezosa.tsx): con 100 ediciones, la página no carga 100 portadas de golpe.
 * Solo responde en el equipo del panel.
 */
export async function portadaAdmin(id: string): Promise<ReactNode | null> {
  if (typeof id !== "string" || !adminPermitido((await headers()).get("host"))) return null;
  const ed = getEdicion(id);
  return ed ? <PortadaMini ed={ed} /> : null;
}
