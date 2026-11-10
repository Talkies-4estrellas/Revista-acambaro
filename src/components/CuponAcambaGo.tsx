"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ETIQUETA_ESTADO, descuento, diaDeVencimiento, type EstadoCupon, type EstadoPublico } from "@/lib/cupon-estado";
import { colorCss, type DatosCupon, type ElementoCupon } from "@/lib/esquema";
import { trazoQr } from "@/lib/qr";

/**
 * Cupón real de AcambaGo dentro de una página de la revista.
 * - Se dibuja con los datos guardados en la edición (así carga aunque AcambaGo no responda).
 * - En el sitio pregunta el estado actual (/api/cupones/estado). Si ya no sirve y el negocio tiene otro vigente, muestra ese
 *   («Otra promoción»; se apaga con `sustituir: false`); si no, lo marca «Ya no disponible» y oculta el QR.
 * - «Guárdalo en AcambaGo» lleva a /cupon/<código>?origen=revista en AcambaGo: con sesión lo guarda en la cuenta del lector con su
 *   QR personal (un uso por persona); sin sesión, le pide entrar o crear cuenta. La revista no tiene cuentas.
 * - Al tocarlo abre una ventana con el QR grande, el código para copiar y las condiciones. El QR es el mismo que genera AcambaGo:
 *   el negocio lo escanea con su escáner de siempre y el canje se cuenta allá.
 * Las medidas van en unidades del propio cupón (560 de ancho), así escala igual en la hoja, en el celular y en miniatura.
 */

const u = (n: number) => `${(n / 560) * 100}cqw`;
const URL_ACAMBAGO = process.env.NEXT_PUBLIC_ACAMBAGO_URL?.replace(/\/$/, "") ?? "";

/* ---------- Estado actual: una sola consulta por página aunque haya varios cupones ---------- */
const cache = new Map<string, Promise<EstadoPublico | undefined>>();
let lote: { ids: Set<string>; listo: Promise<Record<string, EstadoPublico>> } | null = null;

function pedirEstado(id: string): Promise<EstadoPublico | undefined> {
  const previo = cache.get(id);
  if (previo) return previo;
  // Hasta 30 cupones por consulta (el límite de /api/cupones/estado).
  if (lote && lote.ids.size >= 30) lote = null;
  if (!lote) {
    const ids = new Set<string>();
    const listo = new Promise<Record<string, EstadoPublico>>((ok) =>
      setTimeout(() => {
        if (lote?.ids === ids) lote = null;
        fetch(`/api/cupones/estado?ids=${[...ids].join(",")}`)
          .then((r) => (r.ok ? r.json() : { estados: {} }))
          .then((j) => ok(j.estados ?? {}))
          .catch(() => ok({}));
      }, 60),
    );
    lote = { ids, listo };
  }
  lote.ids.add(id);
  const p = lote.listo.then((e) => e[id]);
  cache.set(id, p);
  return p;
}

function avisar(edicion: string | undefined, elemento: string | undefined, accion: "abrir" | "copiar" | "guardar") {
  if (!edicion || !elemento) return;
  try {
    navigator.sendBeacon?.("/api/clic", new Blob([JSON.stringify({ e: edicion, i: elemento, u: `cupon:${accion}` })], { type: "text/plain" }));
  } catch {
    // Sin conteo; el cupón funciona igual.
  }
}

/* ---------- QR ---------- */
function Qr({ texto, className, style }: { texto: string; className?: string; style?: CSSProperties }) {
  const { tam, d } = trazoQr(texto);
  // Margen blanco de 2 módulos alrededor: sin él, muchos lectores no lo reconocen.
  return (
    <svg viewBox={`-2 -2 ${tam + 4} ${tam + 4}`} className={className} style={{ background: "#fff", display: "block", ...style }} role="img" aria-label="Código QR del cupón" shapeRendering="crispEdges">
      <path d={d} fill="#000" />
    </svg>
  );
}

const MOTIVO: Partial<Record<EstadoCupon, string>> = {
  vencido: "Este cupón ya venció.",
  agotado: "Este cupón ya se agotó.",
  inactivo: "El negocio desactivó este cupón.",
  negocio: "Este negocio no está disponible por ahora.",
  borrado: "Este cupón ya no existe.",
};

export default function CuponAcambaGo({
  el,
  edicionId,
  editor = false,
  miniatura = false,
  estadoInicial,
}: {
  el: ElementoCupon;
  edicionId?: string;
  editor?: boolean;
  miniatura?: boolean;
  /** Estado ya conocido (la página /cupones lo trae del servidor): no se vuelve a consultar. */
  estadoInicial?: EstadoPublico;
}) {
  const interactivo = !editor && !miniatura;
  const [vivo, setVivo] = useState<EstadoPublico | undefined>(estadoInicial);
  const [vencidoLocal, setVencidoLocal] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!interactivo || estadoInicial) return;
    let vigente = true;
    // Con lo guardado ya se sabe si venció (por si AcambaGo no responde); el estado en vivo manda si llega.
    if (el.datos.vence && new Date(el.datos.vence).getTime() < Date.now()) setVencidoLocal(true);
    pedirEstado(el.cupon).then((e) => vigente && setVivo(e));
    return () => {
      vigente = false;
    };
  }, [interactivo, estadoInicial, el.cupon, el.datos.vence]);

  const estadoPropio: EstadoCupon = vivo?.estado ?? (vencidoLocal ? "vencido" : "vigente");
  // Otra promoción vigente del mismo negocio, si este ya no sirve (y el elemento lo permite).
  const sust = estadoPropio !== "vigente" && el.sustituir !== false ? vivo?.sustituto : undefined;
  const d: DatosCupon = sust?.datos ?? el.datos;
  const estado: EstadoCupon = sust ? "vigente" : estadoPropio;
  const disponible = estado === "vigente";
  const color = colorCss(el.color ?? "terracota", "var(--terracota)");
  const vence = (sust ? d.vence : vivo?.vence !== undefined ? vivo.vence : d.vence) ?? null;
  const usados = sust ? sust.usados : vivo?.usados;
  const limite = sust ? d.limite : (vivo?.limite ?? d.limite);
  const conQr = el.qr !== false;
  const pct = d.tipo === "percent";
  // En el sitio, los textos chicos no bajan de un tamaño legible aunque el cupón quede angosto (en el celular mide ~320 px);
  // en el editor y las miniaturas se respeta la proporción exacta.
  const m = (n: number, px: number) => (interactivo ? `max(${u(n)}, ${px}px)` : u(n));

  const abrir = () => {
    setAbierto(true);
    avisar(edicionId, el.id, "abrir");
  };

  const tarjeta = (
    <div
      style={{
        containerType: "inline-size",
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        overflow: "hidden",
        background: "#fff",
        color: "#1b1b1b",
        border: `${u(3)} solid ${color}`,
        borderRadius: u(12),
        boxSizing: "border-box",
        textAlign: "left",
      }}
    >
      <div style={{ width: "31%", flexShrink: 0, background: color, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: u(8), boxSizing: "border-box" }}>
        <span className="font-display" style={{ fontSize: u(pct ? 50 : 42), fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap" }}>
          {pct ? `${d.valor}%` : descuento(d.tipo, d.valor)}
        </span>
        <span className="font-sans" style={{ fontSize: m(11, 9), fontWeight: 800, letterSpacing: "0.12em", marginTop: u(6), textTransform: "uppercase" }}>
          de descuento
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0, borderLeft: `${u(2)} dashed ${color}`, padding: `${u(16)} ${u(18)}`, display: "flex", flexDirection: "column", gap: u(4) }}>
        <span className="font-sans" style={{ fontSize: m(10.5, 9), fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color }}>
          {sust ? "Otra promoción · AcambaGo" : "Cupón · AcambaGo"}
        </span>
        <span className="font-display" style={{ fontSize: m(21, 14), fontWeight: 800, lineHeight: 1.15, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {d.titulo}
        </span>
        {d.negocio && (
          <span className="font-sans" style={{ fontSize: m(13, 11), fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.negocio}
          </span>
        )}
        <span style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: u(10), flexWrap: "wrap" }}>
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: m(14, 11), fontWeight: 800, letterSpacing: "0.06em", border: `${u(1.5)} dashed #1b1b1b55`, borderRadius: u(6), padding: `${u(3)} ${u(8)}` }}>
            {d.codigo}
          </span>
          <span className="font-sans" style={{ fontSize: m(11, 10), color: "#555" }}>
            {vence ? `Vence ${diaDeVencimiento(vence)}` : "Sin vencimiento"}
          </span>
        </span>
      </div>
      {conQr && disponible && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", paddingRight: u(16) }}>
          <Qr texto={d.qr} style={{ width: u(108), height: u(108) }} />
        </div>
      )}
      {!disponible && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.72)" }}>
          <span className="font-sans" style={{ transform: "rotate(-6deg)", border: `${u(3)} solid #6b1d1d`, color: "#6b1d1d", background: "#fff", padding: `${u(6)} ${u(14)}`, fontSize: u(18), fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: u(6) }}>
            Ya no disponible
          </span>
        </div>
      )}
    </div>
  );

  if (!interactivo) return tarjeta;

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-label={`Cupón de ${descuento(d.tipo, d.valor)} de descuento${d.negocio ? ` en ${d.negocio}` : ""}: ${d.titulo}. ${disponible ? "Abrir para ver el código y el QR." : `${ETIQUETA_ESTADO[estado]}.`}`}
        style={{ display: "block", width: "100%", height: "100%", padding: 0, border: 0, background: "none", font: "inherit", color: "inherit", cursor: "pointer", boxSizing: "border-box" }}
      >
        {tarjeta}
      </button>
      {abierto && (
        <VentanaCupon
          d={d}
          estado={estado}
          otra={!!sust}
          usados={usados}
          limite={limite}
          vence={vence}
          onCerrar={() => setAbierto(false)}
          onCopiar={() => avisar(edicionId, el.id, "copiar")}
          onGuardar={() => avisar(edicionId, el.id, "guardar")}
        />
      )}
    </>
  );
}

function VentanaCupon({
  d,
  estado,
  otra,
  usados,
  limite,
  vence,
  onCerrar,
  onCopiar,
  onGuardar,
}: {
  d: DatosCupon;
  estado: EstadoCupon;
  /** Es otra promoción del negocio, en lugar de la que se puso en la página. */
  otra: boolean;
  usados?: number;
  limite: number | null;
  vence: string | null;
  onCerrar: () => void;
  onCopiar: () => void;
  onGuardar: () => void;
}) {
  const titulo = useId();
  const cerrar = useRef<HTMLButtonElement>(null);
  const [copiado, setCopiado] = useState(false);
  const disponible = estado === "vigente";
  const quedan = limite != null && usados !== undefined ? Math.max(0, limite - usados) : null;

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    cerrar.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", tecla);
    const desborde = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = desborde;
      antes?.focus();
    };
  }, [onCerrar]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(d.codigo);
      setCopiado(true);
      onCopiar();
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles: el código queda a la vista para anotarlo.
    }
  };

  // data-pageflow: la animación del giro de hoja no copia esta ventana.
  return createPortal(
    <div data-pageflow className="paleta-clara fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titulo}
        onClick={(e) => e.stopPropagation()}
        className="font-sans max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-5 text-ink shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracota">{otra ? "Otra promoción · AcambaGo" : "Cupón · AcambaGo"}</p>
            <h2 id={titulo} className="font-display mt-1 text-2xl font-black leading-tight">
              {descuento(d.tipo, d.valor)} de descuento
            </h2>
            <p className="mt-1 font-semibold">{d.titulo}</p>
            {d.negocio && <p className="text-sm text-ink-soft">{d.negocio}</p>}
          </div>
          <button ref={cerrar} type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-full border border-ink/25 px-3 py-1 text-lg leading-none hover:bg-paper-deep">
            ✕
          </button>
        </div>

        {disponible ? (
          <>
            <div className="mx-auto mt-4 w-full max-w-[16rem] rounded-xl border border-ink/15 bg-white p-3">
              <Qr texto={d.qr} className="h-auto w-full" />
            </div>
            <p className="mt-3 text-center text-sm text-ink-soft">Enséñalo en el negocio: escanearán el QR o anotarán el código.</p>
            {otra && <p className="mt-2 text-center text-xs text-ink-soft">La promoción que venía en esta página terminó; esta es otra vigente del mismo negocio.</p>}
          </>
        ) : (
          <p className="mt-4 rounded-lg border border-ink/25 bg-paper-deep p-3 text-sm">
            <b>Ya no disponible.</b> {MOTIVO[estado] ?? ""}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <span className="flex-1 rounded-lg border-2 border-dashed border-ink/30 px-3 py-2 text-center font-mono text-lg font-black tracking-wider">{d.codigo}</span>
          {disponible && (
            <button type="button" onClick={copiar} className="rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-paper">
              {copiado ? "¡Copiado!" : "Copiar"}
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {copiado ? "Código copiado" : ""}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-ink-soft">Vence</dt>
          <dd className="font-semibold">{vence ? diaDeVencimiento(vence) : "Sin vencimiento"}</dd>
          {limite != null && disponible && (
            <>
              <dt className="text-ink-soft">Usos</dt>
              <dd className="font-semibold">{quedan != null ? `Quedan ${quedan} de ${limite}` : `Hasta ${limite}`}</dd>
            </>
          )}
        </dl>
        {d.descripcion && <p className="mt-3 text-sm">{d.descripcion}</p>}

        {URL_ACAMBAGO && disponible && (
          <div className="mt-4 rounded-xl border border-ink/20 bg-paper-deep/60 p-3">
            <a
              href={`${URL_ACAMBAGO}/cupon/${encodeURIComponent(d.codigo)}?origen=revista`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onGuardar}
              onAuxClick={onGuardar}
              className="block rounded-lg bg-terracota px-4 py-2.5 text-center text-sm font-bold text-paper"
            >
              Guárdalo en tu cuenta de AcambaGo ↗
            </a>
            <p className="mt-2 text-center text-xs text-ink-soft">Queda en tu cuenta con tu propio QR. Si no tienes cuenta, ahí mismo puedes crear una.</p>
          </div>
        )}
        {URL_ACAMBAGO && (
          <a href={`${URL_ACAMBAGO}/business/${d.negocioId}`} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-lg border border-ink/25 px-4 py-2.5 text-center text-sm font-bold hover:bg-paper-deep">
            Ver el negocio en AcambaGo ↗
          </a>
        )}
      </div>
    </div>,
    document.body,
  );
}
