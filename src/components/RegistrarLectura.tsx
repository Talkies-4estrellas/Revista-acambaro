"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { guardarLectura } from "@/lib/lectura";

/**
 * Anota la página abierta para «Seguir leyendo». Va en el layout de la edición: usePathname cambia al entrar y al girar la hoja en PC.
 * Mientras se baja en el celular, la dirección cambia sin pasar por el router, así que eso lo anota FlujoMovil.
 */
export default function RegistrarLectura({ id, total, tema, numero }: { id: string; total: number; tema: string; numero: string }) {
  const ruta = usePathname();
  useEffect(() => {
    const n = Number(ruta.split("/").pop());
    if (Number.isInteger(n) && n >= 1) guardarLectura({ id, n, total, tema, numero, href: ruta });
  }, [ruta, id, total, tema, numero]);
  return null;
}
