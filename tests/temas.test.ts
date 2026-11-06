import { describe, expect, it } from "vitest";
import type { Edicion } from "@/lib/ediciones";
import { TEMAS, edicionesRelacionadas, paginasDeTema, temaDeSeccion } from "@/lib/temas";

const ed = (id: string, secciones: string[]) =>
  ({ id, numero: id, tema: id, fecha: "2026-01-01", paginas: secciones.map((seccion) => ({ plantilla: "lienzo", seccion, titulo: seccion })) }) as unknown as Edicion;

describe("temas", () => {
  it("reconoce la sección sin importar acentos ni mayúsculas", () => {
    expect(temaDeSeccion("Gastronomía")).toBe("sabor");
    expect(temaDeSeccion("gastronomia")).toBe("sabor");
    expect(temaDeSeccion("  HISTORIA ")).toBe("historia");
  });

  it("deja fuera lo que no es de ningún tema", () => {
    expect(temaDeSeccion("Publicidad")).toBeUndefined();
    expect(temaDeSeccion("")).toBeUndefined();
    expect(temaDeSeccion(undefined)).toBeUndefined();
  });

  it("ninguna sección está en dos temas", () => {
    const todas = TEMAS.flatMap((t) => t.secciones.map((s) => s.toLowerCase()));
    expect(new Set(todas).size).toBe(todas.length);
  });

  it("lista las páginas del tema con su número real dentro de la edición", () => {
    const paginas = paginasDeTema("sabor", [ed("a", ["Publicidad", "Sabor", "Historia", "Cocina"])]);
    expect(paginas.map((p) => [p.n, p.href])).toEqual([
      [2, "/ediciones/a/2"],
      [4, "/ediciones/a/4"],
    ]);
  });
});

describe("ediciones relacionadas", () => {
  it("prefiere las que comparten más temas y nunca sugiere la misma", () => {
    const actual = ed("a", ["Historia", "Sabor"]);
    const lista = edicionesRelacionadas(actual, [actual, ed("b", ["Publicidad"]), ed("c", ["Sabor"]), ed("d", ["Historia", "Cocina"])]);
    expect(lista.map((e) => e.id)).toEqual(["d", "c", "b"]);
  });

  it("a igual coincidencia gana la más reciente y respeta el máximo", () => {
    const actual = ed("a", ["Historia"]);
    const lista = edicionesRelacionadas(actual, [ed("b", ["Sabor"]), ed("c", ["Gente"]), actual], 1);
    expect(lista.map((e) => e.id)).toEqual(["b"]);
  });
});
