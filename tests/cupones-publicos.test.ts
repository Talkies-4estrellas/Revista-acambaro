import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilaCupon } from "@/lib/cupon-estado";
import { cuponesVigentes, estadosDeCupones } from "@/lib/cupones-publicos";

const NEG = "cf31580e-db6c-4cf2-a5cd-50beafb11deb";
const fila = (id: string, o: Partial<FilaCupon> = {}): FilaCupon => ({
  id,
  business_id: NEG,
  title: "Cupón",
  description: null,
  discount_type: "percent",
  value: "10.00",
  code: `ACAM-${id.slice(0, 6).toUpperCase()}`,
  qr_data: null,
  limit_count: null,
  used_count: 0,
  expires_at: null,
  is_active: true,
  created_at: "2026-07-01T00:00:00Z",
  businesses: { name: "Aura fit", is_approved: true, is_active: true },
  ...o,
});
const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const ahora = new Date("2026-11-10T18:00:00Z");

/** Simula la API REST de AcambaGo con estas filas (filtra por id=in.(…) o business_id=in.(…)). */
function simular(filas: FilaCupon[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const q = new URL(url).searchParams;
      const lista = (campo: string) => q.get(campo)?.replace(/^in\.\(|\)$/g, "").split(",");
      const ids = lista("id");
      const negocios = lista("business_id");
      const r = filas.filter((f) => (!ids || ids.includes(f.id)) && (!negocios || negocios.includes(f.business_id)) && (q.get("is_active") !== "eq.true" || f.is_active));
      return new Response(JSON.stringify(r), { status: 200 });
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("ACAMBAGO_SUPABASE_URL", "https://ejemplo.supabase.co");
  vi.stubEnv("ACAMBAGO_SUPABASE_ANON_KEY", "clave-publica");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("estado de los cupones de una página", () => {
  it("si un cupón venció, ofrece otro vigente del mismo negocio que no esté ya en la página", async () => {
    simular([
      fila(id(1), { expires_at: "2026-07-23T00:00:00Z" }),
      fila(id(2), { created_at: "2026-08-01T00:00:00Z" }),
      fila(id(3), { created_at: "2026-09-01T00:00:00Z", is_active: false }),
    ]);
    const e = await estadosDeCupones([id(1)], ahora);
    expect(e[id(1)].estado).toBe("vencido");
    expect(e[id(1)].sustituto?.id).toBe(id(2));
    expect(e[id(1)].sustituto?.datos.valor).toBe(10);

    // Si el único vigente ya está en la página, no se repite.
    const e2 = await estadosDeCupones([id(1), id(2)], ahora);
    expect(e2[id(1)].sustituto).toBeUndefined();
    expect(e2[id(2)].estado).toBe("vigente");
  });

  it("un cupón borrado en AcambaGo sale como «borrado»; uno de negocio suspendido no busca sustituto", async () => {
    simular([fila(id(1), { businesses: { name: "X", is_approved: true, is_active: false } }), fila(id(2))]);
    const e = await estadosDeCupones([id(1), id(9)], ahora);
    expect(e[id(9)].estado).toBe("borrado");
    expect(e[id(1)].estado).toBe("negocio");
    expect(e[id(1)].sustituto).toBeUndefined();
  });

  it("ignora ids que no son de AcambaGo y, sin conexión configurada, responde vacío", async () => {
    simular([]);
    expect(await estadosDeCupones(["../../etc", "1 OR 1=1"], ahora)).toEqual({});
    vi.unstubAllEnvs();
    expect(await estadosDeCupones([id(1)], ahora)).toEqual({});
    expect(await cuponesVigentes(ahora)).toBeNull();
  });
});

describe("página pública de cupones", () => {
  it("lista solo los vigentes de negocios visibles", async () => {
    simular([
      fila(id(1)),
      fila(id(2), { limit_count: 1, used_count: 1 }),
      fila(id(3), { businesses: { name: "Y", is_approved: false, is_active: true } }),
      fila(id(4), { expires_at: "2026-07-01T00:00:00Z" }),
    ]);
    const l = await cuponesVigentes(ahora);
    expect(l?.map((c) => c.id)).toEqual([id(1)]);
  });
});
