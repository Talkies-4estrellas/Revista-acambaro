import { COLUMNAS_CUPON, datosDesdeFila, estadoDeFila, type EstadoPublico, type FilaCupon } from "./cupon-estado";

/**
 * Lecturas de cupones de AcambaGo para el SITIO PUBLICADO (solo servidor): estado de los cupones de una página y lista de
 * vigentes para /cupones. Van por la API REST de Supabase con la clave pública y se guardan unos minutos en la caché de Next,
 * para no consultar AcambaGo en cada visita. Sin las variables ACAMBAGO_SUPABASE_* devuelven vacío y el sitio sigue con lo guardado.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MINUTOS = 5;

async function consultar(filtro: string): Promise<FilaCupon[] | null> {
  const url = process.env.ACAMBAGO_SUPABASE_URL?.trim();
  const clave = process.env.ACAMBAGO_SUPABASE_ANON_KEY?.trim();
  if (!url || !clave) return null;
  const r = await fetch(`${url}/rest/v1/coupons?select=${COLUMNAS_CUPON}&${filtro}`, {
    headers: { apikey: clave, Authorization: `Bearer ${clave}` },
    next: { revalidate: MINUTOS * 60 },
  });
  if (!r.ok) throw new Error(`AcambaGo respondió ${r.status}`);
  return (await r.json()) as FilaCupon[];
}

/**
 * Estado actual de esos cupones. Un id que no vuelve fue borrado en AcambaGo. Si un cupón ya no sirve y su negocio tiene otro
 * vigente, se incluye como `sustituto` (el más nuevo que no esté ya en la página): el sitio lo muestra en su lugar si el
 * elemento lo permite.
 */
export async function estadosDeCupones(idsCrudos: string[], ahora = new Date()): Promise<Record<string, EstadoPublico>> {
  const ids = [...new Set(idsCrudos)].filter((i) => UUID.test(i)).slice(0, 30);
  if (!ids.length) return {};
  const filas = await consultar(`id=in.(${ids.join(",")})`);
  if (!filas) return {};

  const estados: Record<string, EstadoPublico> = {};
  for (const f of filas) estados[f.id] = { estado: estadoDeFila(f, ahora), usados: f.used_count, limite: f.limit_count, vence: f.expires_at };
  for (const id of ids) estados[id] ??= { estado: "borrado", usados: 0, limite: null, vence: null };

  // Sustitutos: una sola consulta con los negocios de los cupones que ya no sirven.
  const caidos = filas.filter((f) => estados[f.id].estado !== "vigente" && estados[f.id].estado !== "negocio");
  const negocios = [...new Set(caidos.map((f) => f.business_id))].filter((n) => UUID.test(n));
  if (negocios.length) {
    const otros = (await consultar(`business_id=in.(${negocios.join(",")})&is_active=eq.true&order=created_at.desc`)) ?? [];
    const enPagina = new Set(ids);
    for (const f of caidos) {
      const s = otros.find((o) => o.business_id === f.business_id && !enPagina.has(o.id) && estadoDeFila(o, ahora) === "vigente");
      if (s) estados[f.id].sustituto = { id: s.id, datos: datosDesdeFila(s, ahora), usados: s.used_count };
    }
  }
  return estados;
}

export type CuponPublico = { id: string; datos: ReturnType<typeof datosDesdeFila>; estado: EstadoPublico };

/** Todos los cupones vigentes de AcambaGo (de negocios aprobados y activos), del más nuevo al más viejo. null si no hay conexión. */
export async function cuponesVigentes(ahora = new Date()): Promise<CuponPublico[] | null> {
  const filas = await consultar("is_active=eq.true&order=created_at.desc");
  if (!filas) return null;
  return filas
    .filter((f) => estadoDeFila(f, ahora) === "vigente")
    .map((f) => ({
      id: f.id,
      datos: datosDesdeFila(f, ahora),
      estado: { estado: "vigente", usados: f.used_count, limite: f.limit_count, vence: f.expires_at },
    }));
}
