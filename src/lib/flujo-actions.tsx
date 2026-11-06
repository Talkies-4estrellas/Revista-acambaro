"use server";

import type { ReactNode } from "react";
import { CuerpoFlujo } from "@/components/plantillas";
import EdicionesRelacionadas from "@/components/EdicionesRelacionadas";
import { getEdicion } from "@/lib/ediciones";

/**
 * Para el scroll continuo del celular (components/FlujoMovil.tsx): dibuja en el servidor el cuerpo de la página `n` de una edición (de cualquier tipo) para que el cliente lo agregue debajo de la página que se está leyendo. Al dibujarse aquí, sus componentes interactivos
 * (animaciones, parallax, antes y después, revelar al tocar…) llegan ya listos. Devuelve null si la página no existe.
 */
export async function cargarPaginaFlujo(id: string, n: number): Promise<ReactNode | null> {
  if (typeof id !== "string" || !Number.isInteger(n)) return null;
  const ed = getEdicion(id);
  if (!ed || n < 1 || n > ed.paginas.length) return null;
  const pagina = ed.paginas[n - 1];
  return <CuerpoFlujo ed={ed} n={n} pagina={pagina} />;
}

/** Las ediciones relacionadas para el final del scroll del celular: se piden al llegar, para no cargarlas con cada página. */
export async function cargarRelacionadas(id: string): Promise<ReactNode | null> {
  const ed = typeof id === "string" ? getEdicion(id) : undefined;
  return ed ? <EdicionesRelacionadas ed={ed} /> : null;
}
