import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { carpetaTemporal } from "./carpeta-temporal";

describe("ajustes (.env.local)", () => {
  let t: ReturnType<typeof carpetaTemporal>;
  let aj: typeof import("@/lib/ajustes");
  const env = () => fs.readFileSync(t.ruta(".env.local"), "utf8");

  beforeEach(async () => {
    t = carpetaTemporal();
    aj = await import("@/lib/ajustes");
  });
  afterEach(() => t.limpiar());

  it("crea el archivo si no existe, sin copia porque no había nada que respaldar", () => {
    aj.guardarAjustes({ NEXT_PUBLIC_SITE_URL: "https://revista.test" });
    expect(aj.leerEnvLocal()).toEqual({ NEXT_PUBLIC_SITE_URL: "https://revista.test" });
    expect(fs.existsSync(t.ruta("content", "respaldos", "env-local"))).toBe(false);
  });

  it("conserva comentarios y otras variables, y deja copia del archivo anterior", () => {
    fs.writeFileSync(t.ruta(".env.local"), '# mío\nOTRA="hola"\nNEXT_PUBLIC_SITE_URL=http://viejo.test\n');
    aj.guardarAjustes({ NEXT_PUBLIC_SITE_URL: "https://nuevo.test" });
    expect(env()).toContain("# mío");
    expect(aj.leerEnvLocal()).toEqual({ OTRA: "hola", NEXT_PUBLIC_SITE_URL: "https://nuevo.test" });

    const copias = fs.readdirSync(t.ruta("content", "respaldos", "env-local"));
    expect(copias).toHaveLength(1);
    expect(fs.readFileSync(t.ruta("content", "respaldos", "env-local", copias[0]), "utf8")).toContain("viejo.test");
  });

  it("dejar el valor vacío quita la variable", () => {
    aj.guardarAjustes({ NEXT_PUBLIC_SITE_URL: "https://a.test", NEXT_PUBLIC_CONTACTO_ANUNCIOS: "https://wa.me/521" });
    aj.guardarAjustes({ NEXT_PUBLIC_SITE_URL: "" });
    expect(aj.leerEnvLocal()).toEqual({ NEXT_PUBLIC_CONTACTO_ANUNCIOS: "https://wa.me/521" });
  });

  it("nunca cambia las variables que abren el panel", () => {
    expect(() => aj.guardarAjustes({ ADMIN_ALLOW_REMOTE: "true" })).toThrow(/no se puede cambiar/);
    expect(() => aj.guardarAjustes({ ADMIN_ENABLED: "true" })).toThrow(/no se puede cambiar/);
    expect(() => aj.guardarAjustes({ OTRA_COSA: "x" })).toThrow(/no se puede cambiar/);
    expect(fs.existsSync(t.ruta(".env.local"))).toBe(false);
  });

  it("no acepta enlaces peligrosos ni direcciones inválidas", () => {
    expect(() => aj.guardarAjustes({ NEXT_PUBLIC_CONTACTO_ANUNCIOS: "javascript:alert(1)" })).toThrow();
    expect(() => aj.guardarAjustes({ NEXT_PUBLIC_SITE_URL: "no es url" })).toThrow();
    expect(() => aj.guardarAjustes({ CLICS_WEBHOOK_URL: "http://sin-cifrar.test" })).toThrow();
  });

  it("acepta WhatsApp, correo y teléfono como contacto", () => {
    for (const v of ["https://wa.me/5214170000000", "mailto:hola@revista.test", "tel:+524170000000"]) {
      expect(() => aj.guardarAjustes({ NEXT_PUBLIC_CONTACTO_ANUNCIOS: v })).not.toThrow();
    }
  });

  it("no deja meter comillas ni saltos de línea que rompan el archivo", () => {
    expect(() => aj.guardarAjustes({ CLICS_WEBHOOK_URL: 'https://x.test/"a' })).toThrow(/comillas/);
    expect(() => aj.guardarAjustes({ NEXT_PUBLIC_SITE_URL: "https://x.test\nADMIN_ENABLED=true" })).toThrow(/saltos de línea/);
  });

  it("no muestra un webhook completo", () => {
    expect(aj.ocultarValor("https://script.google.com/macros/s/SECRETO/exec")).toBe("https://script.google.com/…");
  });
});
