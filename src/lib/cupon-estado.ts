/**
 * Estado de un cupón de AcambaGo, sin depender de Supabase: lo usan el panel, el editor y el sitio publicado.
 * Mismas reglas que AcambaGo al canjear: desactivado → vencido (vence < ahora) → agotado (usos ≥ límite) → negocio no visible → vigente.
 */
export type EstadoCupon = "vigente" | "vencido" | "agotado" | "inactivo" | "negocio" | "borrado";

export const ETIQUETA_ESTADO: Record<EstadoCupon, string> = {
  vigente: "Vigente",
  vencido: "Vencido",
  agotado: "Agotado",
  inactivo: "Desactivado",
  negocio: "Negocio no visible",
  borrado: "Ya no existe",
};

export type DatosEstado = {
  is_active: boolean;
  expires_at: string | null;
  limit_count: number | null;
  used_count: number;
  negocio: { aprobado: boolean; activo: boolean } | null;
};

export function estadoCupon(c: DatosEstado, ahora = new Date()): EstadoCupon {
  if (!c.is_active) return "inactivo";
  if (c.expires_at && new Date(c.expires_at).getTime() < ahora.getTime()) return "vencido";
  if (c.limit_count != null && c.used_count >= c.limit_count) return "agotado";
  if (c.negocio && (!c.negocio.aprobado || !c.negocio.activo)) return "negocio";
  return "vigente";
}

/** «20 %» o «$50». */
export const descuento = (tipo: "percent" | "fixed", valor: number) => (tipo === "percent" ? `${valor} %` : `$${valor.toLocaleString("es-MX")}`);

/**
 * La fecha de vencimiento como día de calendario. AcambaGo la guarda como medianoche UTC de un <input type="date">:
 * se leen año/mes/día tal cual para no mostrar el día anterior por la zona horaria de México (mismo arreglo que parseDateOnly en AcambaGo).
 */
export function diaDeVencimiento(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

/** Fila de `coupons` (con su negocio) tal como la devuelve la API REST de AcambaGo. */
export type FilaCupon = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  value: number | string;
  code: string;
  qr_data: string | null;
  limit_count: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  businesses: { name: string; is_approved: boolean; is_active: boolean } | null;
};

/** Columnas que se piden a AcambaGo para dibujar un cupón (para `select=`). */
export const COLUMNAS_CUPON = "id,business_id,title,description,discount_type,value,code,qr_data,limit_count,used_count,expires_at,is_active,created_at,businesses(name,is_approved,is_active)";

export const estadoDeFila = (f: FilaCupon, ahora = new Date()) =>
  estadoCupon(
    {
      is_active: f.is_active,
      expires_at: f.expires_at,
      limit_count: f.limit_count,
      used_count: f.used_count,
      negocio: f.businesses ? { aprobado: f.businesses.is_approved, activo: f.businesses.is_active } : null,
    },
    ahora,
  );

/** Los datos que se dibujan, a partir de una fila de AcambaGo (mismo formato que se guarda en la edición). */
export function datosDesdeFila(f: FilaCupon, ahora = new Date()): import("./esquema").DatosCupon {
  return {
    titulo: f.title.trim(),
    ...(f.description?.trim() ? { descripcion: f.description.trim() } : {}),
    tipo: f.discount_type,
    valor: Number(f.value),
    codigo: f.code,
    qr: f.qr_data || JSON.stringify({ coupon_code: f.code, business_id: f.business_id }),
    negocio: f.businesses?.name ?? "",
    negocioId: f.business_id,
    vence: f.expires_at,
    limite: f.limit_count,
    tomado: ahora.toISOString(),
  };
}

/** Estado actual de un cupón para el sitio; si ya no sirve, puede traer otro vigente del mismo negocio para mostrar en su lugar. */
export type EstadoPublico = {
  estado: EstadoCupon;
  usados: number;
  limite: number | null;
  vence: string | null;
  sustituto?: { id: string; datos: import("./esquema").DatosCupon; usados: number };
};
