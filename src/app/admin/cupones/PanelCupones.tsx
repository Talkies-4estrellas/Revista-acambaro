"use client";

import { RealtimeClient } from "@supabase/realtime-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clienteAcambaGo,
  diaDeVencimiento,
  estadoCupon,
  ETIQUETA_ESTADO,
  leerCuponesAcambaGo,
  textoDescuento,
  type CuponAcambaGo,
  type EstadoCupon,
} from "@/lib/cupones-acambago";

type Filtro = "todos" | EstadoCupon;
type Conexion = "conectando" | "en-vivo" | "sin-conexion";

const COLOR_ESTADO: Record<EstadoCupon, string> = {
  vigente: "bg-terracota text-paper",
  vencido: "bg-ink/10 text-ink-soft",
  agotado: "bg-ocre/25 text-ink",
  inactivo: "bg-ink/10 text-ink-soft line-through",
  negocio: "bg-indigo/15 text-ink",
  borrado: "bg-ink/10 text-ink-soft",
};

const fechaHora = (iso: string) => new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Lista de cupones con aviso en vivo: escucha los cambios de la tabla `coupons` de AcambaGo (Supabase Realtime)
 * y, ante cualquier alta, cambio o baja, vuelve a leer la lista completa (así también llega el nombre del negocio).
 * Para que el aviso funcione, la tabla tiene que estar en la publicación de Realtime (Doc/acambago-cupones-en-vivo.sql).
 */
export default function PanelCupones({ iniciales, errorInicial, leido, url, clave }: { iniciales: CuponAcambaGo[]; errorInicial: string | null; leido: string; url: string; clave: string }) {
  const [cupones, setCupones] = useState(iniciales);
  const [error, setError] = useState(errorInicial);
  const [conexion, setConexion] = useState<Conexion>("conectando");
  const [actualizado, setActualizado] = useState(() => new Date(leido));
  const [nuevos, setNuevos] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  // Arranca con la hora en que el servidor leyó la lista, para que el servidor y el navegador dibujen lo mismo.
  const [ahora, setAhora] = useState(() => new Date(leido));
  const conocidos = useRef(new Set(iniciales.map((c) => c.id)));
  const cliente = useMemo(() => clienteAcambaGo(url, clave), [url, clave]);

  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Varias altas seguidas (o un cambio que llega junto con el regreso a la pestaña) se juntan en una sola lectura.
  const recargar = useCallback(() => {
    clearTimeout(espera.current);
    espera.current = setTimeout(async () => {
        try {
          const lista = await leerCuponesAcambaGo(cliente);
          const recien = lista.filter((c) => !conocidos.current.has(c.id)).map((c) => c.id);
          lista.forEach((c) => conocidos.current.add(c.id));
          if (recien.length) setNuevos((n) => new Set([...n, ...recien]));
          setCupones(lista);
          setError(null);
          setActualizado(new Date());
          setAhora(new Date());
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }, 300);
  }, [cliente]);

  useEffect(() => {
    // Aviso en vivo con su propia conexión por montaje (compartirla hacía que, al desmontar y volver a montar en desarrollo, se quedara colgada).
    const tiempoReal = new RealtimeClient(url.replace(/^http/, "ws") + "/realtime/v1", { params: { apikey: clave } });
    tiempoReal.setAuth(clave);
    tiempoReal
      .channel("revista-cupones-acambago")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => recargar())
      .subscribe((estado) => setConexion(estado === "SUBSCRIBED" ? "en-vivo" : estado === "CHANNEL_ERROR" || estado === "TIMED_OUT" || estado === "CLOSED" ? "sin-conexion" : "conectando"));
    // Al volver a la pestaña también se relee (por si hubo cambios en los negocios, que no avisan en vivo).
    const alVolver = () => document.visibilityState === "visible" && recargar();
    document.addEventListener("visibilitychange", alVolver);
    // Los vencimientos pasan solos con el tiempo: se recalcula el estado cada minuto.
    const reloj = setInterval(() => setAhora(new Date()), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      clearInterval(reloj);
      tiempoReal.removeAllChannels();
      tiempoReal.disconnect();
    };
  }, [url, clave, recargar]);

  const conEstado = cupones.map((c) => ({ ...c, estado: estadoCupon(c, ahora) }));
  const cuenta = conEstado.reduce<Record<string, number>>((n, c) => ({ ...n, [c.estado]: (n[c.estado] ?? 0) + 1 }), {});
  const texto = busqueda.trim().toLowerCase();
  const visibles = conEstado.filter(
    (c) =>
      (filtro === "todos" || c.estado === filtro) &&
      (!texto || [c.title, c.code, c.description ?? "", c.negocio?.nombre ?? ""].some((t) => t.toLowerCase().includes(texto))),
  );
  const filtros: Filtro[] = ["todos", "vigente", "vencido", "agotado", "inactivo", "negocio"];

  return (
    <section className="font-sans mt-6">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-3 py-1.5 font-bold" role="status">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${conexion === "en-vivo" ? "bg-terracota" : conexion === "conectando" ? "animate-pulse bg-ocre" : "bg-ink/40"}`}
          />
          {conexion === "en-vivo" ? "En vivo" : conexion === "conectando" ? "Conectando…" : "Sin conexión en vivo"}
        </span>
        <span className="text-ink-soft">
          Actualizado {actualizado.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <button type="button" onClick={recargar} className="rounded-full border border-ink/25 px-3 py-1.5 font-bold hover:bg-paper-deep">
          Actualizar ahora
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-ink/25 bg-paper-deep/50 p-3 text-sm">
          <b>No se pudo leer la base de AcambaGo.</b> <span className="text-ink-soft">{error}</span>
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {filtros.map((f) => {
          const n = f === "todos" ? conEstado.length : cuenta[f] ?? 0;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={filtro === f}
              onClick={() => setFiltro(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${filtro === f ? "bg-ink text-paper" : "border border-ink/20 hover:bg-paper-deep"}`}
            >
              {f === "todos" ? "Todos" : ETIQUETA_ESTADO[f]} <span className="font-normal opacity-75">{n}</span>
            </button>
          );
        })}
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar negocio, título o código"
          aria-label="Buscar cupones"
          className="ml-auto w-full rounded-full border border-ink/25 bg-transparent px-4 py-1.5 text-sm sm:w-64"
        />
      </div>

      {visibles.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-ink/25 p-6 text-center text-sm text-ink-soft">
          {cupones.length === 0 ? "AcambaGo todavía no tiene cupones." : "Ningún cupón coincide con el filtro."}
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((c) => (
            <li key={c.id} className="flex flex-col rounded-xl border border-ink/15 bg-paper-deep/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-3xl font-black">{textoDescuento(c)}</span>
                <span className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${COLOR_ESTADO[c.estado]}`}>{ETIQUETA_ESTADO[c.estado]}</span>
                  {nuevos.has(c.id) && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-paper">Nuevo</span>}
                </span>
              </div>
              <p className="mt-2 font-bold leading-snug">{c.title}</p>
              {c.description && <p className="mt-1 text-sm text-ink-soft">{c.description}</p>}
              <p className="mt-2 text-sm">
                <span className="text-ink-soft">Negocio:</span> <b>{c.negocio?.nombre ?? "—"}</b>
                {c.estado === "negocio" && c.negocio && (
                  <span className="text-ink-soft"> ({!c.negocio.aprobado ? "sin aprobar" : "suspendido"})</span>
                )}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-ink/10 pt-3 text-xs">
                <dt className="text-ink-soft">Código</dt>
                <dd className="font-mono font-bold">{c.code}</dd>
                <dt className="text-ink-soft">Usos</dt>
                <dd>
                  {c.used_count} {c.limit_count != null ? `de ${c.limit_count}` : "(sin límite)"}
                </dd>
                <dt className="text-ink-soft">Vence</dt>
                <dd>{c.expires_at ? diaDeVencimiento(c.expires_at) : "Sin vencimiento"}</dd>
                <dt className="text-ink-soft">Creado</dt>
                <dd>{fechaHora(c.created_at)}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
