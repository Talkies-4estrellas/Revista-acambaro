import { describe, expect, it } from "vitest";
import { datosDeCupon, diaDeVencimiento, estadoCupon, textoDescuento, type CuponAcambaGo } from "@/lib/cupones-acambago";
import { elementoCupon, type Pagina } from "@/lib/esquema";
import { trazoQr } from "@/lib/qr";
import { revisarDatos } from "@/lib/revision";

const ahora = new Date("2026-11-10T18:00:00Z");
const base = { is_active: true, expires_at: null, limit_count: null, used_count: 0, negocio: { aprobado: true, activo: true } };

describe("cupones de AcambaGo", () => {
  it("usa las mismas reglas que AcambaGo para el estado", () => {
    expect(estadoCupon(base, ahora)).toBe("vigente");
    expect(estadoCupon({ ...base, is_active: false }, ahora)).toBe("inactivo");
    expect(estadoCupon({ ...base, expires_at: "2026-07-23T00:00:00+00:00" }, ahora)).toBe("vencido");
    expect(estadoCupon({ ...base, expires_at: "2026-12-01T00:00:00+00:00" }, ahora)).toBe("vigente");
    expect(estadoCupon({ ...base, limit_count: 1, used_count: 1 }, ahora)).toBe("agotado");
    expect(estadoCupon({ ...base, negocio: { aprobado: false, activo: true } }, ahora)).toBe("negocio");
  });

  it("desactivado pesa más que vencido o agotado", () => {
    expect(estadoCupon({ ...base, is_active: false, expires_at: "2020-01-01T00:00:00Z", limit_count: 1, used_count: 1 }, ahora)).toBe("inactivo");
  });

  it("muestra la fecha como el día elegido, sin restar uno por la zona horaria", () => {
    expect(diaDeVencimiento("2026-07-23T00:00:00+00:00")).toMatch(/^23 /);
  });

  it("escribe el descuento", () => {
    expect(textoDescuento({ discount_type: "percent", value: 20 })).toBe("20 %");
    expect(textoDescuento({ discount_type: "fixed", value: 1500 })).toBe("$1,500");
  });
});

const cuponReal: CuponAcambaGo = {
  id: "01fd238a-aef7-46b3-8190-0edf45f8b4b5",
  business_id: "7b0e8c1e-1111-4222-8333-944445555666",
  title: " 20% de descuento ",
  description: null,
  discount_type: "percent",
  value: 20,
  code: "ACAM-87UYNM",
  qr_data: '{"coupon_code":"ACAM-87UYNM","business_id":"7b0e8c1e-1111-4222-8333-944445555666"}',
  limit_count: null,
  used_count: 0,
  expires_at: "2026-11-20T00:00:00+00:00",
  is_active: true,
  created_at: "2026-07-28T16:33:17Z",
  negocio: { nombre: "Aura fit", aprobado: true, activo: true },
};

describe("cupón de AcambaGo en una página", () => {
  it("guarda en la edición el QR tal cual lo genera AcambaGo (su escáner lo lee así)", () => {
    const d = datosDeCupon(cuponReal, ahora);
    expect(d.qr).toBe(cuponReal.qr_data);
    expect(d.titulo).toBe("20% de descuento");
    expect(d.negocio).toBe("Aura fit");
    expect(d.descripcion).toBeUndefined();
    // Sin qr_data, arma el mismo formato que AcambaGo.
    expect(JSON.parse(datosDeCupon({ ...cuponReal, qr_data: "" }, ahora).qr)).toEqual({ coupon_code: "ACAM-87UYNM", business_id: cuponReal.business_id });
  });

  it("dibuja un QR válido del contenido", () => {
    const { tam, d } = trazoQr(cuponReal.qr_data);
    expect(tam).toBeGreaterThanOrEqual(21);
    expect((tam - 17) % 4).toBe(0); // los QR miden 21, 25, 29… módulos
    expect(d).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
  });

  it("el revisor avisa de cupones vencidos o por vencer según el día en que se leerá la edición", () => {
    const el = elementoCupon(cuponReal.id, datosDeCupon(cuponReal, ahora));
    const pag = (e: typeof el) => [{ plantilla: "lienzo", elementos: [e] }] as unknown as Pagina[];
    const hoy = new Date("2026-11-10T12:00:00Z");
    expect(revisarDatos(pag(el), "2026-11-10", { hoy }).map((a) => a.tipo)).not.toContain("Cupón vencido");
    expect(revisarDatos(pag(el), "2026-11-15", { hoy }).map((a) => a.tipo)).toContain("Cupón por vencer");
    expect(revisarDatos(pag(el), "2026-11-20", { hoy }).map((a) => a.tipo)).toContain("Cupón vencido");
    const sinFecha = { ...el, datos: { ...el.datos, vence: null } };
    expect(revisarDatos(pag(sinFecha), "2027-01-01", { hoy }).filter((a) => a.tipo.startsWith("Cupón"))).toHaveLength(0);
  });
});
