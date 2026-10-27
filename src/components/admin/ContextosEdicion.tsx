"use client";

import { createContext } from "react";
import type { EstiloGuardado } from "@/lib/esquema";

/** Colores propios de la edición (hexadecimales) y cómo cambiarlos; los provee Editor.tsx y los usan todos los selectores de color. */
export const PaletaEdicionContext = createContext<{ colores: string[]; cambiar: (colores: string[]) => void } | null>(null);

/** Estilos con nombre de la edición y cómo cambiarlos; los usa la barra sobre la hoja. */
export const EstilosEdicionContext = createContext<{ estilos: EstiloGuardado[]; cambiar: (estilos: EstiloGuardado[]) => void } | null>(null);
