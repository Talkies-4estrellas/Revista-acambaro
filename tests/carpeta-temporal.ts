import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";

/**
 * Hace que el código crea que el proyecto está en una carpeta temporal vacía. Los módulos calculan sus rutas al cargarse a partir
 * de process.cwd(): por eso se importan DESPUÉS de llamar esto, con `await import(...)`. Así ninguna prueba toca content/ ni
 * .env.local reales.
 */
export function carpetaTemporal() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "revista-prueba-"));
  fs.mkdirSync(path.join(dir, "content", "ediciones"), { recursive: true });
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.resetModules();
  return {
    dir,
    ruta: (...partes: string[]) => path.join(dir, ...partes),
    limpiar: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}
