import { describe, expect, it } from "vitest";
import { calcularNumeracion, formatoNumero, numeroFijoDe } from "@/lib/numeracion";
import { estadoEdicion, publicarEnMs } from "@/lib/esquema";

const ed = (id: string, fecha: string, publicada = false, fijo?: number) => ({ id, fecha, publicada, fijo });

describe("numeración de ediciones", () => {
  it("una edición publicada conserva su número aunque se desactive", () => {
    const n = calcularNumeracion([ed("a", "2026-01-01", false, 3), ed("b", "2026-02-01", true, 4)]);
    expect(n.get("a")).toEqual({ numero: 3, provisional: false });
    expect(n.get("b")).toEqual({ numero: 4, provisional: false });
  });

  it("una nueva publicada toma el siguiente al número más alto, aunque haya huecos", () => {
    const n = calcularNumeracion([ed("a", "2026-01-01", true, 2), ed("b", "2026-01-02", true, 7), ed("c", "2026-03-01", true)]);
    expect(n.get("c")?.numero).toBe(8);
  });

  it("varias publicadas sin número se ordenan por fecha de publicación", () => {
    const n = calcularNumeracion([
      { id: "tarde", fecha: "2026-01-01", publicada: true, publicarEn: "2026-05-01T09:00" },
      ed("pronto", "2026-02-01", true),
    ]);
    expect(n.get("pronto")?.numero).toBe(1);
    expect(n.get("tarde")?.numero).toBe(2);
  });

  it("los borradores no gastan número: el suyo es provisional y va después de los publicados", () => {
    const n = calcularNumeracion([ed("b1", "2026-01-01"), ed("p", "2026-02-01", true, 5), ed("b2", "2026-03-01")]);
    expect(n.get("b1")).toEqual({ numero: 6, provisional: true });
    expect(n.get("b2")).toEqual({ numero: 7, provisional: true });
  });

  it("escribe el número con dos cifras", () => {
    expect(formatoNumero(7)).toBe("07");
    expect(formatoNumero(101)).toBe("101");
  });

  it("solo hay número fijo con la marca numeroFijo y un número válido", () => {
    expect(numeroFijoDe({ numero: "02", numeroFijo: true })).toBe(2);
    expect(numeroFijoDe({ numero: "02" })).toBeUndefined();
    expect(numeroFijoDe({ numero: "x", numeroFijo: true })).toBeUndefined();
  });
});

describe("estado de publicación", () => {
  const ahora = Date.parse("2026-11-06T18:00:00Z"); // 12:00 en el centro de México

  it("distingue borrador, programada y publicada", () => {
    expect(estadoEdicion({ publicada: false }, ahora)).toBe("borrador");
    expect(estadoEdicion({ publicada: true }, ahora)).toBe("publicada");
    expect(estadoEdicion({ publicada: true, publicarEn: "2026-11-06T12:01" }, ahora)).toBe("programada");
    expect(estadoEdicion({ publicada: true, publicarEn: "2026-11-06T11:59" }, ahora)).toBe("publicada");
  });

  it("la hora programada es del centro de México (UTC−6)", () => {
    expect(publicarEnMs("2026-11-06T09:00")).toBe(Date.parse("2026-11-06T15:00:00Z"));
    expect(publicarEnMs("mañana")).toBeNull();
  });
});
