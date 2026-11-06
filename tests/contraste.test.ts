import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contraste } from "@/lib/accesibilidad";

const css = readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
const raiz = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
const oscuro = css.slice(css.indexOf("html.dark {"), css.indexOf("}", css.indexOf("html.dark {")));

const color = (bloque: string, nombre: string) => {
  const hex = new RegExp(`--${nombre}:\\s*#([0-9a-f]{6})`, "i").exec(bloque)?.[1];
  if (!hex) throw new Error(`falta --${nombre}`);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
};

/** La norma WCAG AA pide 4.5:1 para texto normal: si alguien cambia la paleta, esto avisa. */
describe("contraste de la paleta (WCAG AA)", () => {
  it.each(["paper", "paper-deep"])("el verde y el texto se leen sobre %s en modo claro", (fondo) => {
    for (const texto of ["terracota", "ink", "ink-soft"]) expect(contraste(color(raiz, texto), color(raiz, fondo))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["paper", "paper-deep"])("el verde y el texto se leen sobre %s en modo oscuro", (fondo) => {
    for (const texto of ["terracota", "ink", "ink-soft"]) expect(contraste(color(oscuro, texto), color(oscuro, fondo))).toBeGreaterThanOrEqual(4.5);
  });

  it("el texto claro se lee sobre los botones verdes", () => {
    expect(contraste(color(raiz, "paper"), color(raiz, "terracota"))).toBeGreaterThanOrEqual(4.5);
  });
});
