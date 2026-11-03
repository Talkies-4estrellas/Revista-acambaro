import { execFileSync } from "node:child_process";

/**
 * Qué falta por subir al sitio publicado: cambios sin commit (ediciones, medios y lo demás) y commits sin push.
 * Solo lee git (no cambia nada) y solo tiene sentido en el equipo del panel; si git no está o falla, devuelve null.
 */
export type EstadoGit = {
  rama: string;
  /** Ediciones con cambios sin commit: id → tipo de cambio. */
  ediciones: Map<string, "nueva" | "modificada" | "borrada">;
  medios: number;
  otros: number;
  /** Commits hechos pero sin push; null si la rama no sigue a una rama remota. */
  sinPush: number | null;
};

export function estadoGit(): EstadoGit | null {
  let salida: string;
  try {
    salida = execFileSync("git", ["status", "--porcelain=v1", "-b", "-uall"], { cwd: process.cwd(), encoding: "utf8", timeout: 4000, windowsHide: true });
  } catch {
    return null;
  }
  const lineas = salida.split(/\r?\n/).filter(Boolean);
  const cabecera = lineas[0]?.startsWith("## ") ? lineas.shift()!.slice(3) : "";
  const rama = cabecera.split("...")[0].replace(/^No commits yet on /, "");
  const adelante = /\[(?:[^\]]*?)ahead (\d+)/.exec(cabecera);
  const sinPush = cabecera.includes("...") ? (adelante ? Number(adelante[1]) : 0) : null;

  const ediciones = new Map<string, "nueva" | "modificada" | "borrada">();
  let medios = 0;
  let otros = 0;
  for (const l of lineas) {
    const xy = l.slice(0, 2);
    // «R  viejo -> nuevo»: cuenta el nombre nuevo. Las rutas con espacios vienen entre comillas.
    const ruta = l.slice(3).split(" -> ").pop()!.replace(/^"|"$/g, "");
    const ed = /^content\/ediciones\/([^/]+)\.json$/.exec(ruta);
    if (ed) ediciones.set(ed[1], xy.includes("?") || xy.includes("A") ? "nueva" : xy.includes("D") ? "borrada" : "modificada");
    else if (ruta.startsWith("public/media/")) medios++;
    else otros++;
  }
  return { rama, ediciones, medios, otros, sinPush };
}
