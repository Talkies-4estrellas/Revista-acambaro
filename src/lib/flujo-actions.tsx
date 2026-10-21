"use server";

import type { ReactNode } from "react";
import { CuerpoLienzo } from "@/components/plantillas";
import { getEdicion } from "@/lib/ediciones";

/**
 * Para el scroll continuo del celular (components/FlujoMovil.tsx): dibuja en el servidor el cuerpo de la página `n` de una edición (solo las de
 * tipo «lienzo») para que el cliente lo agregue debajo de la página que se está leyendo. Al dibujarse aquí, sus componentes interactivos
 * (animaciones, parallax, antes y después, revelar al tocar…) llegan ya listos. Devuelve null si la página no existe o no es de lienzo.
 */
export async function cargarPaginaFlujo(id: string, n: number): Promise<ReactNode | null> {
  if (typeof id !== "string" || !Number.isInteger(n)) return null;
  const ed = getEdicion(id);
  if (!ed || n < 1 || n > ed.paginas.length) return null;
  const pagina = ed.paginas[n - 1];
  if (pagina.plantilla !== "lienzo") return null;
  return <CuerpoLienzo ed={ed} n={n} pagina={pagina} />;
}
