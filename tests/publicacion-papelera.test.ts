import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { carpetaTemporal } from "./carpeta-temporal";

describe("publicación y papelera", () => {
  let t: ReturnType<typeof carpetaTemporal>;
  let admin: typeof import("@/lib/admin");
  let extra: typeof import("@/lib/admin-extra");
  const base = { numero: "", fecha: "2026-11-06", tema: "Prueba" };
  const leer = (id: string) => JSON.parse(fs.readFileSync(t.ruta("content", "ediciones", `${id}.json`), "utf8"));
  const enPapelera = () => fs.readdirSync(t.ruta("content", "papelera"));

  beforeEach(async () => {
    t = carpetaTemporal();
    admin = await import("@/lib/admin");
    extra = await import("@/lib/admin-extra");
    admin.crearEdicion("prueba", base);
  });
  afterEach(() => t.limpiar());

  it("no se pueden crear ediciones con el nombre de una sección del panel", () => {
    for (const id of ["medios", "papelera", "Calendario", "ajustes", "anunciantes", "clics", "newsletter"]) {
      expect(() => admin.crearEdicion(id, base)).toThrow(/sección del panel/);
    }
  });

  it("publicar deja la edición publicada y le fija su número", () => {
    extra.cambiarPublicacion("prueba", "publicar");
    expect(leer("prueba")).toMatchObject({ publicada: true, numeroFijo: true, numero: "01" });
  });

  it("programar guarda la fecha y exige una válida", () => {
    expect(() => extra.cambiarPublicacion("prueba", "programar")).toThrow(/día y la hora/);
    expect(() => extra.cambiarPublicacion("prueba", "programar", "mañana")).toThrow(/día y la hora/);
    extra.cambiarPublicacion("prueba", "programar", "2026-12-01T09:00");
    expect(leer("prueba")).toMatchObject({ publicada: true, publicarEn: "2026-12-01T09:00" });
  });

  it("publicar ya quita la fecha programada", () => {
    extra.cambiarPublicacion("prueba", "programar", "2026-12-01T09:00");
    extra.cambiarPublicacion("prueba", "publicar");
    expect(leer("prueba").publicarEn).toBeUndefined();
  });

  it("desactivar conserva el número", () => {
    extra.cambiarPublicacion("prueba", "publicar");
    extra.cambiarPublicacion("prueba", "desactivar");
    expect(leer("prueba")).toMatchObject({ publicada: false, numeroFijo: true, numero: "01" });
  });

  it("una muestra no se publica", () => {
    fs.writeFileSync(t.ruta("content", "ediciones", "prueba.json"), JSON.stringify({ ...leer("prueba"), muestra: true }));
    expect(() => extra.cambiarPublicacion("prueba", "publicar")).toThrow(/muestra/);
  });

  it("una edición que no existe da error", () => {
    expect(() => extra.cambiarPublicacion("nada", "publicar")).toThrow(/no existe/);
  });

  it("una publicada no se borra; un borrador va a la papelera y se recupera", () => {
    extra.cambiarPublicacion("prueba", "publicar");
    expect(() => admin.borrarBorrador("prueba")).toThrow(/publicada no se puede borrar/);

    extra.cambiarPublicacion("prueba", "desactivar");
    admin.borrarBorrador("prueba");
    expect(fs.existsSync(t.ruta("content", "ediciones", "prueba.json"))).toBe(false);

    const lista = extra.listarPapelera();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ tipo: "edicion", id: "prueba", tema: "Prueba", numero: "01" });

    expect(extra.recuperarEdicion(lista[0].archivo)).toBe("prueba");
    expect(leer("prueba").tema).toBe("Prueba");
    expect(enPapelera()).toEqual([]);
  });

  it("al recuperar con el nombre ocupado vuelve como «-recuperada» sin pisar la otra", () => {
    admin.borrarBorrador("prueba");
    const archivo = enPapelera()[0];
    admin.crearEdicion("prueba", { ...base, tema: "La nueva" });

    expect(extra.recuperarEdicion(archivo)).toBe("prueba-recuperada");
    expect(leer("prueba").tema).toBe("La nueva");
    expect(leer("prueba-recuperada").tema).toBe("Prueba");
  });

  it("no recupera archivos fuera de la papelera", () => {
    expect(() => extra.recuperarEdicion("../ediciones/prueba.json")).toThrow(/no está en la papelera/);
    expect(() => extra.recuperarMedio("../../.env.local")).toThrow(/no está en la papelera/);
    expect(() => extra.rutaEnPapeleraMedios("..\\..\\.env.local")).toThrow(/no está en la papelera/);
  });

  it("un medio quitado vuelve a su carpeta, y con otro nombre si ya hay uno igual", () => {
    fs.mkdirSync(t.ruta("public", "media", "prueba"), { recursive: true });
    const foto = t.ruta("public", "media", "prueba", "foto.jpg");
    fs.writeFileSync(foto, "uno");
    extra.quitarMedio("/media/prueba/foto.jpg");
    expect(fs.existsSync(foto)).toBe(false);

    fs.writeFileSync(foto, "dos");
    const archivo = fs.readdirSync(t.ruta("content", "papelera-medios"))[0];
    expect(extra.recuperarMedio(archivo)).toBe("/media/prueba/foto-recuperada.jpg");
    expect(fs.readFileSync(foto, "utf8")).toBe("dos");
  });

  it("no deja quitar un medio que usa una edición", () => {
    fs.mkdirSync(t.ruta("public", "media", "prueba"), { recursive: true });
    fs.writeFileSync(t.ruta("public", "media", "prueba", "foto.jpg"), "x");
    const e = leer("prueba");
    e.paginas[0].elementos = [{ tipo: "imagen", id: "a", x: 0, y: 0, w: 10, h: 10, src: "/media/prueba/foto.jpg", alt: "x" }];
    fs.writeFileSync(t.ruta("content", "ediciones", "prueba.json"), JSON.stringify(e));
    expect(() => extra.quitarMedio("/media/prueba/foto.jpg")).toThrow(/lo usa/);
  });

  it("no deja quitar un medio que usa el código del sitio", () => {
    fs.mkdirSync(t.ruta("public", "media", "prueba"), { recursive: true });
    fs.writeFileSync(t.ruta("public", "media", "prueba", "foto.jpg"), "x");
    fs.mkdirSync(t.ruta("src"), { recursive: true });
    fs.writeFileSync(t.ruta("src", "pagina.tsx"), 'const f = "/media/prueba/foto.jpg";');
    expect(() => extra.quitarMedio("/media/prueba/foto.jpg")).toThrow(/el sitio/);
  });
});
