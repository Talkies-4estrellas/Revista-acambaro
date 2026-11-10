/**
 * Cupones de AcambaGo (el ecommerce): la revista solo los LEE de la base de Supabase de AcambaGo.
 * Nunca crea, edita ni borra. Usa la clave pública (anon) de AcambaGo (variables ACAMBAGO_SUPABASE_* de .env.local).
 * Las reglas del estado viven en cupon-estado.ts, que no carga Supabase (lo usa también el sitio publicado).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { descuento } from "./cupon-estado";
import type { DatosCupon } from "./esquema";

export { ETIQUETA_ESTADO, diaDeVencimiento, estadoCupon, type EstadoCupon } from "./cupon-estado";

export type CuponAcambaGo = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  value: number;
  code: string;
  /** Lo que AcambaGo pone en el QR del cupón (lo lee su escáner). */
  qr_data: string;
  limit_count: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  negocio: { nombre: string; aprobado: boolean; activo: boolean } | null;
};

/** Credenciales desde .env.local; null si no están (el panel lo explica en vez de fallar). */
export function credencialesAcambaGo(): { url: string; clave: string } | null {
  const url = process.env.ACAMBAGO_SUPABASE_URL?.trim();
  const clave = process.env.ACAMBAGO_SUPABASE_ANON_KEY?.trim();
  return url && clave ? { url, clave } : null;
}

const clientes = new Map<string, SupabaseClient>();
/** Un solo cliente por base (en el navegador, crear varios hace que Supabase avise de instancias repetidas). */
export function clienteAcambaGo(url: string, clave: string) {
  let c = clientes.get(url);
  if (!c) clientes.set(url, (c = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })));
  return c;
}

type Fila = Omit<CuponAcambaGo, "negocio"> & { businesses: { name: string; is_approved: boolean; is_active: boolean } | null };

/** Todos los cupones (activos o no), del más nuevo al más viejo, con el nombre de su negocio. */
export async function leerCuponesAcambaGo(cliente: SupabaseClient): Promise<CuponAcambaGo[]> {
  const { data, error } = await cliente
    .from("coupons")
    .select("id, business_id, title, description, discount_type, value, code, qr_data, limit_count, used_count, expires_at, is_active, created_at, businesses(name, is_approved, is_active)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Fila[]).map(({ businesses, ...c }) => ({
    ...c,
    value: Number(c.value),
    negocio: businesses ? { nombre: businesses.name, aprobado: businesses.is_approved, activo: businesses.is_active } : null,
  }));
}

/** «20 %» o «$50». */
export const textoDescuento = (c: Pick<CuponAcambaGo, "discount_type" | "value">) => descuento(c.discount_type, c.value);

/** Lo que se guarda en la edición al poner este cupón en una página (la «foto» de sus datos). */
export function datosDeCupon(c: CuponAcambaGo, ahora = new Date()): DatosCupon {
  return {
    titulo: c.title.trim(),
    ...(c.description?.trim() ? { descripcion: c.description.trim() } : {}),
    tipo: c.discount_type,
    valor: c.value,
    codigo: c.code,
    qr: c.qr_data || JSON.stringify({ coupon_code: c.code, business_id: c.business_id }),
    negocio: c.negocio?.nombre ?? "",
    negocioId: c.business_id,
    vence: c.expires_at,
    limite: c.limit_count,
    tomado: ahora.toISOString(),
  };
}
