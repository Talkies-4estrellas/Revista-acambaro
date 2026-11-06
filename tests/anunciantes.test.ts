import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { carpetaTemporal } from "./carpeta-temporal";

const AHORA = new Date("2026-11-06T18:00:00Z");
const vista = (edicion: string, pagina: number, dias: Record<string, number>) => ({ edicion, pagina, dias, total: Object.values(dias).reduce((a, b) => a + b, 0), ultimo: "" });
const clic = (edicion: string, pagina: number, url: string, dias: Record<string, number>) => ({ edicion, pagina, url, elemento: url, etiqueta: "x", anuncio: true, dias, total: Object.values(dias).reduce((a, b) => a + b, 0), ultimo: "" });

describe("anunciantes", () => {
  let t: ReturnType<typeof carpetaTemporal>;
  let an: typeof import("@/lib/anunciantes");
  const ediciones = [{ id: "e1", tema: "Tema", numero: "01", publicada: true, paginas: [{ plantilla: "lienzo", titulo: "Portada" }, { plantilla: "lienzo", titulo: "Anuncio · Pan", seccion: "Publicidad" }] }] as never;
  const con = (extra = {}) => ({ id: "x", nombre: "Pan", anuncios: [{ edicion: "e1", pagina: 2 }], enlaces: [], creado: "", ...extra });

  beforeEach(async () => {
    t = carpetaTemporal();
    an = await import("@/lib/anunciantes");
  });
  afterEach(() => t.limpiar());

  it("crea, cambia y quita, con un id legible que no se repite", () => {
    expect(an.crearAnunciante({ nombre: "Panadería Núñez" }).id).toBe("panaderia-nunez");
    const dos = an.crearAnunciante({ nombre: "Panadería Núñez" });
    expect(dos.id).toBe("panaderia-nunez-2");
    expect(an.actualizarAnunciante(dos.id, { nombre: "Otra", vence: "2026-12-01" })).toMatchObject({ nombre: "Otra", vence: "2026-12-01" });
    an.borrarAnunciante(dos.id);
    expect(an.leerAnunciantes().map((a) => a.id)).toEqual(["panaderia-nunez"]);
  });

  it("valida el nombre, la fecha y que exista", () => {
    expect(() => an.crearAnunciante({ nombre: "  " })).toThrow(/nombre/);
    expect(() => an.crearAnunciante({ nombre: "A", vence: "mañana" })).toThrow(/fecha/);
    expect(() => an.actualizarAnunciante("nada", { nombre: "A" })).toThrow(/no existe/);
  });

  it("limpia sus enlaces y no repite páginas", () => {
    const a = an.crearAnunciante({ nombre: "A", enlaces: "Hobby.mx\n hobby.mx ,wa.me/52", anuncios: [{ edicion: "e1", pagina: 2 }, { edicion: "e1", pagina: 2 }, { edicion: "../x", pagina: 1 }] });
    expect(a.enlaces).toEqual(["hobby.mx", "wa.me/52"]);
    expect(a.anuncios).toEqual([{ edicion: "e1", pagina: 2 }]);
  });

  it("suma vistas y clics por periodo, y calcula la tasa", () => {
    const n = an.numerosDe(con(), {
      ediciones,
      ahora: AHORA,
      vistas: [vista("e1", 2, { "2026-11-05": 6, "2026-10-20": 4 }), vista("e1", 1, { "2026-11-05": 99 })],
      clics: [clic("e1", 2, "https://a.test", { "2026-11-05": 1 })],
    });
    expect(n.vistas).toEqual({ d7: 6, d30: 10, total: 10 });
    expect(n.clics.total).toBe(1);
    expect(n.tasa).toBeCloseTo(0.1);
    expect(n.dias).toHaveLength(30);
    expect(n.dias.at(-1)?.dia).toBe("2026-11-06");
  });

  it("con enlaces propios solo cuenta los suyos, aunque la página sea compartida", () => {
    const clics = [clic("e1", 2, "https://suyo.test/x", { "2026-11-05": 3 }), clic("e1", 2, "https://otro.test", { "2026-11-05": 9 })];
    expect(an.numerosDe(con({ enlaces: ["suyo.test"] }), { ediciones, ahora: AHORA, vistas: [], clics }).clics.total).toBe(3);
    expect(an.numerosDe(con(), { ediciones, ahora: AHORA, vistas: [], clics }).clics.total).toBe(12);
  });

  it("sin vistas la tasa queda vacía, no en cero ni infinita", () => {
    expect(an.numerosDe(con(), { ediciones, ahora: AHORA, vistas: [], clics: [] }).tasa).toBeNull();
  });

  it("cuenta los días para vencer, también si ya venció", () => {
    const dias = (vence?: string) => an.numerosDe(con({ vence }), { ediciones, ahora: AHORA, vistas: [], clics: [] }).venceEn;
    expect(dias("2026-11-09")).toBe(3);
    expect(dias("2026-11-06")).toBe(0);
    expect(dias("2026-11-01")).toBe(-5);
    expect(dias()).toBeNull();
  });

  it("marca los anuncios cuya página ya no existe", () => {
    const n = an.numerosDe(con({ anuncios: [{ edicion: "e1", pagina: 2 }, { edicion: "e1", pagina: 9 }] }), { ediciones, ahora: AHORA, vistas: [], clics: [] });
    expect(n.anuncios.map((a) => a.existe)).toEqual([true, false]);
    expect(n.anuncios[0].titulo).toBe("Anuncio · Pan");
  });
});
