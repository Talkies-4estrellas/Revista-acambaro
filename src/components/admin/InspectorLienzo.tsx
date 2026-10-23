"use client";

import { TRANSICIONES, type Transicion } from "@/lib/transiciones";
import {
  AJUSTES,
  ALINEACIONES,
  ALINEACIONES_V,
  COLORES,
  ETIQUETAS_COLOR,
  CATEGORIAS_FUENTE,
  ETIQUETAS_PESO,
  FUENTES_INFO,
  FORMAS,
  CAPAS_IMAGEN,
  CAPAS_IMAGEN_IDS,
  FILTROS_IMAGEN,
  FILTROS_IMAGEN_IDS,
  SOMBRAS,
  SOMBRAS_IDS,
  PARALLAX,
  PARALLAX_IDS,
  FORMAS_GLOBO,
  COLAS_GLOBO,
  FUENTES,
  TONOS,
  colorCss,
  MOLDES,
  MOLDES_IDS,
  estiloMolde,
  type Elemento,
  type Fuente,
  type Globo,
  type MoldeId,
  type Pagina,
  type Peso,
} from "@/lib/esquema";
import { BUCLES, BUCLES_IDS, EFECTOS, EFECTOS_IDS, HOVERS, HOVERS_IDS, esEfectoTexto, type Efecto } from "@/lib/animaciones";
import { ICONOS } from "@/lib/iconos-datos";
import { IconoSvg } from "@/components/Lienzo";
import { useEffect, useState } from "react";
import {
  Area,
  Campo,
  CampoArchivo,
  ControlPaneles,
  Interruptor,
  Numero,
  Panel,
  Selector,
  Texto,
  VideoEditor,
  btnCls,
  inputCls,
} from "./campos";

/* ------------------------------- Color ------------------------------- */

export function CampoColor({
  label,
  value,
  onChange,
  vacio,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  /** Si se da, se ofrece una opción "sin color" con este texto. */
  vacio?: string;
}) {
  const hex = value && value.startsWith("#") ? value : "";
  return (
    <Campo label={label}>
      <div className="flex flex-wrap items-center gap-1.5">
        {vacio !== undefined && (
          <button
            type="button"
            title={vacio}
            aria-label={vacio}
            onClick={() => onChange(undefined)}
            className={`h-6 w-6 border text-[0.6rem] leading-none ${value === undefined ? "border-terracota ring-2 ring-terracota" : "border-ink/40"}`}
          >
            ∅
          </button>
        )}
        {COLORES.map((c) => (
          <button
            key={c}
            type="button"
            title={ETIQUETAS_COLOR[c]}
            aria-label={ETIQUETAS_COLOR[c]}
            onClick={() => onChange(c)}
            style={{ background: colorCss(c, "#000") }}
            className={`h-6 w-6 border ${value === c ? "border-terracota ring-2 ring-terracota" : "border-ink/40"}`}
          />
        ))}
        <input
          type="color"
          aria-label="Color libre"
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#068562"}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer border border-ink/40 bg-transparent p-0"
        />
        {hex && <span className="font-sans text-[0.7rem] text-ink-soft">{hex}</span>}
      </div>
    </Campo>
  );
}

/* -------------------------------- Moldes ------------------------------ */

export function CampoMolde({ value, onChange }: { value: MoldeId | undefined; onChange: (m: MoldeId | undefined) => void }) {
  const tile = (activo: boolean) =>
    `flex aspect-square items-center justify-center border p-1.5 ${activo ? "border-terracota ring-2 ring-terracota" : "border-ink/30 hover:border-ink"}`;
  return (
    <Campo label="Molde (marco)" hint={value ? MOLDES[value].nombre : "Sin molde: se usan las esquinas redondas."}>
      <div className="grid grid-cols-6 gap-1.5">
        <button type="button" className={tile(!value)} onClick={() => onChange(undefined)} title="Sin molde" aria-label="Sin molde">
          <span className="font-sans text-xs">∅</span>
        </button>
        {MOLDES_IDS.map((id) => (
          <button key={id} type="button" className={tile(value === id)} onClick={() => onChange(id)} title={MOLDES[id].nombre} aria-label={MOLDES[id].nombre}>
            <span className="block h-full w-full bg-ink" style={estiloMolde(id)} />
          </button>
        ))}
      </div>
    </Campo>
  );
}

/* ------------------------------ Alineación --------------------------- */

export type Alineacion6 = "izq" | "cen" | "der" | "sup" | "med" | "inf";

/** Iconos de 16×16: una guía y dos barras alineadas contra ella. */
function Icono({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      {children}
    </svg>
  );
}
const ICONOS_ALINEAR: Record<Alineacion6 | "disH" | "disV", React.ReactNode> = {
  izq: <Icono><rect x="1" y="1" width="1.5" height="14" /><rect x="4" y="3" width="10" height="3.5" /><rect x="4" y="9.5" width="6" height="3.5" /></Icono>,
  cen: <Icono><rect x="7.25" y="1" width="1.5" height="14" /><rect x="2.5" y="3" width="11" height="3.5" /><rect x="4.5" y="9.5" width="7" height="3.5" /></Icono>,
  der: <Icono><rect x="13.5" y="1" width="1.5" height="14" /><rect x="2" y="3" width="10" height="3.5" /><rect x="6" y="9.5" width="6" height="3.5" /></Icono>,
  sup: <Icono><rect x="1" y="1" width="14" height="1.5" /><rect x="3" y="4" width="3.5" height="10" /><rect x="9.5" y="4" width="3.5" height="6" /></Icono>,
  med: <Icono><rect x="1" y="7.25" width="14" height="1.5" /><rect x="3" y="2.5" width="3.5" height="11" /><rect x="9.5" y="4.5" width="3.5" height="7" /></Icono>,
  inf: <Icono><rect x="1" y="13.5" width="14" height="1.5" /><rect x="3" y="2" width="3.5" height="10" /><rect x="9.5" y="6" width="3.5" height="6" /></Icono>,
  disH: <Icono><rect x="1" y="1" width="1.5" height="14" /><rect x="13.5" y="1" width="1.5" height="14" /><rect x="6" y="4" width="4" height="8" /></Icono>,
  disV: <Icono><rect x="1" y="1" width="14" height="1.5" /><rect x="1" y="13.5" width="14" height="1.5" /><rect x="4" y="6" width="8" height="4" /></Icono>,
};

export function PanelAlinear({
  n,
  respectoHoja,
  onRespectoHoja,
  onAlinear,
  onDistribuir,
}: {
  n: number;
  respectoHoja: boolean;
  onRespectoHoja: (v: boolean) => void;
  onAlinear: (a: Alineacion6) => void;
  onDistribuir: (eje: "h" | "v") => void;
}) {
  const botones: { a: Alineacion6; t: string }[] = [
    { a: "izq", t: "Alinear a la izquierda" },
    { a: "cen", t: "Centrar horizontalmente" },
    { a: "der", t: "Alinear a la derecha" },
    { a: "sup", t: "Alinear arriba" },
    { a: "med", t: "Centrar verticalmente" },
    { a: "inf", t: "Alinear abajo" },
  ];
  const btn = `${btnCls} flex h-8 w-8 items-center justify-center !p-0`;
  return (
    <Panel
      titulo="Alinear"
      ayuda={n > 1 && !respectoHoja ? "Respecto al conjunto seleccionado." : "Respecto a la hoja."}
    >
      <div className="flex flex-wrap gap-1">
        {botones.map((b) => (
          <button key={b.a} type="button" className={btn} title={b.t} aria-label={b.t} onClick={() => onAlinear(b.a)}>
            {ICONOS_ALINEAR[b.a]}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-ink/20" />
        <button type="button" className={btn} title="Distribuir horizontalmente (3 o más)" aria-label="Distribuir horizontalmente" disabled={n < 3} onClick={() => onDistribuir("h")}>
          {ICONOS_ALINEAR.disH}
        </button>
        <button type="button" className={btn} title="Distribuir verticalmente (3 o más)" aria-label="Distribuir verticalmente" disabled={n < 3} onClick={() => onDistribuir("v")}>
          {ICONOS_ALINEAR.disV}
        </button>
      </div>
      {n > 1 && <Interruptor label="Alinear respecto a la hoja" value={respectoHoja} onChange={onRespectoHoja} />}
    </Panel>
  );
}

export function InspectorMultiple({
  n,
  esGrupo,
  acciones,
  onCascada,
}: {
  n: number;
  /** La selección es exactamente un grupo permanente. */
  esGrupo: boolean;
  acciones: {
    frente: () => void;
    atras: () => void;
    duplicar: () => void;
    eliminar: () => void;
    agrupar: () => void;
    desagrupar: () => void;
  };
  /** Aplica un efecto a la selección, escalonado de arriba abajo. */
  onCascada: (efecto: Efecto, pasoMs: number) => void;
}) {
  const [efecto, setEfecto] = useState<Efecto>("subir");
  const [paso, setPaso] = useState(150);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1">
        <h3 className="font-sans mr-auto text-xs font-bold uppercase tracking-wider">
          {esGrupo ? `Grupo de ${n} elementos` : `${n} elementos seleccionados`}
        </h3>
        {esGrupo ? (
          <button type="button" className={btnCls} onClick={acciones.desagrupar} title="Desagrupar (Ctrl+Mayús+G)">Desagrupar</button>
        ) : (
          <button type="button" className={btnCls} onClick={acciones.agrupar} title="Agrupar (Ctrl+G)">Agrupar</button>
        )}
        <button type="button" className={btnCls} onClick={acciones.frente} title="Traer al frente">↥ Frente</button>
        <button type="button" className={btnCls} onClick={acciones.atras} title="Enviar atrás">↧ Atrás</button>
        <button type="button" className={btnCls} onClick={acciones.duplicar} title="Duplicar (Ctrl+D)">⧉</button>
        <button type="button" className={btnCls} onClick={acciones.eliminar} title="Eliminar (Supr)">✕</button>
      </div>
      <p className="font-sans text-[0.72rem] leading-relaxed text-ink-soft">
        Arrastra cualquiera de ellos para moverlos juntos; los tiradores del recuadro punteado cambian el tamaño del conjunto
        (en las esquinas escala también el texto) y el círculo de arriba lo gira. Mayús o Ctrl + clic agrega o quita elementos;
        arrastrar sobre la hoja vacía dibuja un rectángulo de selección; Ctrl+A selecciona todo.
        {esGrupo
          ? " Doble clic en un elemento del grupo lo selecciona solo, para editarlo."
          : " Agrupar los mantiene unidos: al hacer clic en uno se selecciona el grupo entero."}
      </p>

      <Panel titulo="Animar en cascada" ayuda="Aplica el mismo efecto a toda la selección, de arriba abajo, con una pausa creciente entre elementos.">
        <Selector label="Efecto" value={efecto} onChange={(v) => setEfecto(v ?? "subir")} opciones={EFECTOS_IDS.map((id) => ({ valor: id, etiqueta: EFECTOS[id].nombre }))} />
        <Numero label="Pausa entre elementos (ms)" value={paso} onChange={(v) => setPaso(Math.max(0, v ?? 0))} min={0} max={2000} />
        <button type="button" className={btnCls} onClick={() => onCascada(efecto, paso)}>
          ▶ Aplicar y probar
        </button>
      </Panel>
    </div>
  );
}

/* ------------------------------ Elemento ----------------------------- */

const num = (v: number | undefined, d: number) => (Number.isFinite(v as number) ? (v as number) : d);

type TipoDestino = "" | "pagina" | "ancla" | "suscribirse" | "inicio" | "buscar" | "edicion" | "correo" | "telefono" | "whatsapp" | "ruta" | "externo";

/** A qué clase de destino apunta un enlace (para elegir el campo de edición adecuado). */
function tipoDestino(enlace: Elemento["enlace"]): TipoDestino {
  if (enlace === undefined || enlace === "") return "";
  if (typeof enlace === "number") return "pagina";
  if (enlace.startsWith("#")) return "ancla";
  if (enlace === "/suscribirse") return "suscribirse";
  if (enlace === "/") return "inicio";
  if (enlace === "/buscar") return "buscar";
  if (/^\/ediciones\/[\w-]*(\/\d+)?$/.test(enlace)) return "edicion";
  if (/^mailto:/i.test(enlace)) return "correo";
  if (/^tel:/i.test(enlace)) return "telefono";
  if (/^https:\/\/wa\.me\//i.test(enlace)) return "whatsapp";
  if (enlace.startsWith("/")) return "ruta";
  return "externo";
}

type EdicionLista = { id: string; numero: string; tema: string; paginas: number; publicada: boolean };
let cacheEdiciones: EdicionLista[] | null = null;

/** «Lleva a»: páginas de esta edición, otra edición, inicio, correo, teléfono, WhatsApp o una dirección externa. Con muchas páginas añade un buscador. */
function SelectorDestino({
  enlace,
  paginas,
  anclas,
  onChange,
}: {
  enlace: Elemento["enlace"];
  paginas: string[];
  anclas?: (string | undefined)[];
  onChange: (enlace: Elemento["enlace"]) => void;
}) {
  const [filtro, setFiltro] = useState("");
  const [ediciones, setEdiciones] = useState<EdicionLista[]>(cacheEdiciones ?? []);
  const tipo = tipoDestino(enlace);
  const texto = typeof enlace === "string" ? enlace : "";
  useEffect(() => {
    if (tipo !== "edicion" || cacheEdiciones) return;
    let vivo = true;
    fetch("/api/admin/ediciones")
      .then((r) => r.json())
      .then((d: { ediciones?: EdicionLista[] }) => {
        cacheEdiciones = d.ediciones ?? [];
        if (vivo) setEdiciones(cacheEdiciones);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [tipo]);

  const valor = tipo === "pagina" ? String(enlace) : tipo === "ancla" ? texto : tipo === "ruta" ? "externo" : tipo;
  const f = filtro.trim().toLowerCase();
  const opciones = paginas
    .map((t, i) => ({ t, i, valor: anclas?.[i] ? `#${anclas[i]}` : String(i + 1), ancla: anclas?.[i] }))
    .filter((o) => !f || o.valor === valor || `${o.i + 1} ${o.t} ${o.ancla ?? ""}`.toLowerCase().includes(f));

  const [, edId = "", edPag = ""] = /^\/ediciones\/([\w-]*)(?:\/(\d+))?$/.exec(texto) ?? [];
  const destinoEdicion = (id: string, pag: string) => (id ? (pag ? `/ediciones/${id}/${pag}` : `/ediciones/${id}`) : "/ediciones/");
  const wa = /^https:\/\/wa\.me\/(\d*)(?:\?text=(.*))?$/i.exec(texto);
  const waNum = wa?.[1] ?? "";
  let waMsg = "";
  try {
    waMsg = decodeURIComponent(wa?.[2] ?? "");
  } catch {}
  const destinoWa = (num: string, msg: string) => `https://wa.me/${num.replace(/\D/g, "")}${msg.trim() ? `?text=${encodeURIComponent(msg.trim())}` : ""}`;

  return (
    <>
      {paginas.length > 12 && (
        <Campo label="Buscar página">
          <input className={inputCls} value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Número, título o identificador…" />
        </Campo>
      )}
      <Campo label="Lleva a">
        <select
          className={inputCls}
          value={valor}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") onChange(undefined);
            else if (v === "externo") onChange("https://");
            else if (v === "suscribirse") onChange("/suscribirse");
            else if (v === "inicio") onChange("/");
            else if (v === "buscar") onChange("/buscar");
            else if (v === "edicion") onChange(destinoEdicion(cacheEdiciones?.find((x) => x.publicada)?.id ?? "", ""));
            else if (v === "correo") onChange("mailto:");
            else if (v === "telefono") onChange("tel:");
            else if (v === "whatsapp") onChange("https://wa.me/");
            else onChange(v.startsWith("#") ? v : Number(v));
          }}
        >
          <option value="">Sin enlace</option>
          <optgroup label="Esta edición">
            {opciones.map((o) => (
              <option key={o.i} value={o.valor}>
                Página {o.i + 1}: {o.t}
                {o.ancla ? ` · #${o.ancla}` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label="Otras partes de la revista">
            <option value="edicion">Otra edición (y su página)…</option>
            <option value="inicio">Inicio de la revista</option>
            <option value="buscar">Buscador</option>
            <option value="suscribirse">Formulario de suscripción (newsletter)</option>
          </optgroup>
          <optgroup label="Contacto y fuera de la revista">
            <option value="correo">Escribir un correo…</option>
            <option value="telefono">Llamar por teléfono…</option>
            <option value="whatsapp">Abrir WhatsApp…</option>
            <option value="externo">Otra dirección web…</option>
          </optgroup>
        </select>
      </Campo>
      {tipo === "edicion" && (
        <>
          <Campo label="Edición">
            <select className={inputCls} value={edId} onChange={(e) => onChange(destinoEdicion(e.target.value, edPag))}>
              {!ediciones.some((x) => x.id === edId) && <option value={edId}>{edId ? `Edición ${edId}` : "Elige una edición…"}</option>}
              {ediciones.map((x) => (
                <option key={x.id} value={x.id}>
                  N.º {x.numero} · {x.tema}
                  {x.publicada ? "" : " (borrador)"}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Página (vacío = portada)">
            <input className={inputCls} inputMode="numeric" value={edPag} onChange={(e) => onChange(destinoEdicion(edId, e.target.value.replace(/\D/g, "").slice(0, 3)))} placeholder="Ej. 5" />
          </Campo>
          <p className="font-sans text-[0.7rem] text-ink-soft">Solo funciona si esa edición está publicada. El enlace queda fijo al número de página: si luego la mueves, vuelve a elegirla.</p>
        </>
      )}
      {tipo === "correo" && (
        <Campo label="Correo">
          <input className={inputCls} type="email" value={texto.replace(/^mailto:/i, "")} onChange={(e) => onChange(`mailto:${e.target.value.trim()}`)} placeholder="anuncios@ejemplo.com" />
        </Campo>
      )}
      {tipo === "telefono" && (
        <Campo label="Teléfono">
          <input className={inputCls} type="tel" value={texto.replace(/^tel:/i, "")} onChange={(e) => onChange(`tel:${e.target.value.replace(/[^\d+\s().-]/g, "")}`)} placeholder="+52 417 000 0000" />
        </Campo>
      )}
      {tipo === "whatsapp" && (
        <>
          <Campo label="Número (con lada de país)">
            <input className={inputCls} inputMode="tel" value={waNum} onChange={(e) => onChange(destinoWa(e.target.value, waMsg))} placeholder="5214170000000" />
          </Campo>
          <Campo label="Mensaje inicial (opcional)">
            <input className={inputCls} value={waMsg} onChange={(e) => onChange(destinoWa(waNum, e.target.value))} placeholder="Hola, vi su anuncio en ACOM-Di…" />
          </Campo>
        </>
      )}
    </>
  );
}

export function InspectorElemento({
  el,
  cambiar,
  paginas,
  anclas,
  globoSel,
  onGloboSel,
  acciones,
}: {
  el: Elemento;
  /** `clave` agrupa ediciones seguidas del mismo campo en un solo paso de deshacer. */
  cambiar: (patch: Partial<Elemento>, clave?: string) => void;
  paginas: string[];
  /** Identificador de cada página (si lo tiene): el enlace por identificador sigue a la página si se mueve. */
  anclas?: (string | undefined)[];
  /** Globo de texto seleccionado en la imagen (también se elige en el lienzo). */
  globoSel?: number | null;
  onGloboSel?: (i: number | null) => void;
  acciones: {
    frente: () => void;
    atras: () => void;
    duplicar: () => void;
    eliminar: () => void;
    ajustarAlto?: () => void;
    /** Solo si el elemento pertenece a un grupo. */
    seleccionarGrupo?: () => void;
    /** Abre la biblioteca para sustituir el icono (solo en iconos). */
    cambiarIcono?: () => void;
    /** Reproduce la animación de entrada de este elemento en la hoja. */
    probarAnimacion?: () => void;
  };
}) {
  const set = (patch: Record<string, unknown>, clave?: string) => cambiar(patch as Partial<Elemento>, clave);
  const nombre = { texto: "Texto", imagen: "Imagen", video: "Video", forma: "Forma", icono: "Icono" }[el.tipo];

  return (
    <div className="space-y-4">
      {acciones.seleccionarGrupo && (
        <p className="font-sans flex items-center justify-between gap-2 border border-dashed border-terracota px-3 py-2 text-[0.72rem]">
          <span>Este elemento pertenece a un grupo.</span>
          <button type="button" className={btnCls} onClick={acciones.seleccionarGrupo}>Seleccionar el grupo</button>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1">
        <h3 className="font-sans mr-auto text-xs font-bold uppercase tracking-wider">{nombre}</h3>
        <ControlPaneles />
        <button type="button" className={btnCls} onClick={acciones.frente} title="Traer al frente">↥ Frente</button>
        <button type="button" className={btnCls} onClick={acciones.atras} title="Enviar atrás">↧ Atrás</button>
        <button type="button" className={btnCls} onClick={acciones.duplicar} title="Duplicar (Ctrl+D)">⧉</button>
        <button type="button" className={btnCls} onClick={acciones.eliminar} title="Eliminar (Supr)">✕</button>
      </div>

      {el.tipo === "texto" && (
        <Panel titulo="Texto" plegable>
          {el.contenido ? (
            <div className="space-y-2 border border-dashed border-ink/40 bg-white/40 dark:bg-white/5 p-3">
              <p className="font-sans text-[0.72rem] leading-relaxed text-ink-soft">
                Este texto tiene formato por partes (negritas, colores, tipografías…). Edítalo con doble clic sobre la hoja.
              </p>
              <p className="font-sans line-clamp-3 text-xs italic text-ink-soft">{el.texto}</p>
              <button
                type="button"
                className={btnCls}
                onClick={() => set({ contenido: undefined })}
                title="Descarta el formato por partes y deja el texto plano"
              >
                Quitar el formato por partes
              </button>
            </div>
          ) : (
            <Area label="Contenido" value={el.texto} onChange={(v) => set({ texto: v }, "texto")} rows={4} hint="Doble clic sobre la hoja para dar formato a partes del texto (negrita, color, tipografía, tamaño…)." />
          )}
          <Campo label="Tipografía">
            <select
              className={inputCls}
              value={el.fuente ?? "serif"}
              onChange={(e) => {
                const f = e.target.value as Fuente;
                const pesos = FUENTES_INFO[f].pesos;
                const actual = el.peso ?? 400;
                // Si la tipografía nueva no tiene el grosor actual, se usa el más cercano que sí tenga.
                const peso = pesos.includes(actual) ? actual : pesos.reduce((m, p) => (Math.abs(p - actual) < Math.abs(m - actual) ? p : m), pesos[0]);
                set({ fuente: f, peso: peso === 400 ? undefined : peso });
              }}
            >
              {CATEGORIAS_FUENTE.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {FUENTES.filter((f) => FUENTES_INFO[f].categoria === cat).map((f) => (
                    <option key={f} value={f}>
                      {FUENTES_INFO[f].nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Numero label="Tamaño" value={el.tam ?? 24} onChange={(v) => set({ tam: v }, "tam")} min={4} max={600} />
            <Selector
              label="Grosor"
              value={String(el.peso ?? 400) as "400"}
              onChange={(v) => set({ peso: v && Number(v) !== 400 ? (Number(v) as Peso) : undefined })}
              opciones={FUENTES_INFO[el.fuente ?? "serif"].pesos.map((p) => ({ valor: String(p) as "400", etiqueta: ETIQUETAS_PESO[p] }))}
            />
            <Numero label="Interlineado (×10)" value={Math.round((el.interlineado ?? 1.3) * 10)} onChange={(v) => set({ interlineado: v ? v / 10 : undefined }, "interlineado")} min={5} max={40} />
            <Numero label="Espaciado (1 = 0,01 em)" value={Math.round((el.espaciado ?? 0) * 100)} onChange={(v) => set({ espaciado: v ? v / 100 : undefined }, "espaciado")} min={-50} max={200} />
            <Selector label="Alineación" value={el.alinear ?? "izquierda"} onChange={(v) => set({ alinear: v })} opciones={ALINEACIONES} />
            <Selector label="Vertical" value={el.vertical ?? "arriba"} onChange={(v) => set({ vertical: v })} opciones={ALINEACIONES_V} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Interruptor label="Cursiva" value={el.cursiva ?? false} onChange={(v) => set({ cursiva: v || undefined })} />
            <Interruptor label="MAYÚSCULAS" value={el.mayusculas ?? false} onChange={(v) => set({ mayusculas: v || undefined })} />
          </div>
          <CampoColor label="Color del texto" value={el.color ?? "tinta"} onChange={(v) => set({ color: v })} />
          {acciones.ajustarAlto && (
            <button type="button" className={btnCls} onClick={acciones.ajustarAlto}>
              Ajustar el alto al texto
            </button>
          )}
        </Panel>
      )}

      {el.tipo === "texto" && (
        <Panel titulo="Fondo y borde" plegable abierto={!!(el.fondo || el.borde || el.boton)} resumen={el.boton ? "Botón" : el.fondo ? "Con fondo" : el.borde ? "Con borde" : "Sin fondo"}>
            <CampoColor label="Fondo de la caja" value={el.fondo} onChange={(v) => set({ fondo: v })} vacio="Sin fondo" />
            <div className="grid grid-cols-2 gap-3">
              <Numero label="Relleno interior" value={el.relleno} onChange={(v) => set({ relleno: v })} min={0} />
              <Numero label="Esquinas redondas" value={el.radio} onChange={(v) => set({ radio: v || undefined }, "radio")} min={0} />
              <Numero label="Grosor del borde" value={el.borde} onChange={(v) => set({ borde: v || undefined }, "borde")} min={0} />
            </div>
            {el.borde ? <CampoColor label="Color del borde" value={el.colorBorde ?? "tinta"} onChange={(v) => set({ colorBorde: v })} /> : null}
            <Interruptor label="Es un botón (el revisor avisa si no lleva enlace)" value={el.boton ?? false} onChange={(v) => set({ boton: v || undefined })} />
        </Panel>
      )}

      {el.tipo === "imagen" && (
        <Panel titulo="Imagen" plegable>
          <CampoArchivo label={el.comparar ? "Archivo («antes», a la izquierda)" : "Archivo"} value={el.src} onChange={(v) => set({ src: v })} />
          <CampoArchivo
            label="Segunda imagen (comparar antes / después)"
            value={el.comparar?.src}
            onChange={(v) => set({ comparar: v ? { ...el.comparar, src: v } : undefined })}
          />
          {el.comparar && (
            <div className="grid grid-cols-2 gap-3">
              <Texto label="Rótulo izquierdo" value={el.comparar.antes} onChange={(v) => set({ comparar: { ...el.comparar!, antes: v || undefined } }, "comparar-antes")} placeholder="Antes" />
              <Texto label="Rótulo derecho" value={el.comparar.despues} onChange={(v) => set({ comparar: { ...el.comparar!, despues: v || undefined } }, "comparar-despues")} placeholder="Después" />
            </div>
          )}
          <Texto label="Texto alternativo" value={el.alt} onChange={(v) => set({ alt: v }, "alt")} hint="Describe la imagen (accesibilidad)" />
          <Texto label="Crédito (autor y licencia)" value={el.credito} onChange={(v) => set({ credito: v || undefined }, "credito")} placeholder="Foto: Nombre, CC BY-SA 4.0" hint="Se junta con el de las demás imágenes donde pongas {creditos} en un texto (p. ej. la página de créditos)" />
          {(el.ajuste ?? "cubrir") === "cubrir" && (
            <div className="grid grid-cols-2 gap-3">
              <Numero label="Enfoque horizontal (%)" value={el.enfoque?.x ?? 50} onChange={(v) => set({ enfoque: { x: Math.min(100, Math.max(0, v ?? 50)), y: el.enfoque?.y ?? 50 } }, "enfoque")} min={0} max={100} />
              <Numero label="Enfoque vertical (%)" value={el.enfoque?.y ?? 50} onChange={(v) => set({ enfoque: { x: el.enfoque?.x ?? 50, y: Math.min(100, Math.max(0, v ?? 50)) } }, "enfoque")} min={0} max={100} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Selector label="Ajuste" value={el.ajuste ?? "cubrir"} onChange={(v) => set({ ajuste: v })} opciones={AJUSTES.map((a) => ({ valor: a, etiqueta: a === "cubrir" ? "Cubrir (recorta)" : "Contener (completa)" }))} />
            <Numero label="Esquinas redondas" value={el.radio} onChange={(v) => set({ radio: v }, "radio")} min={0} />
          </div>
          <Selector label="Color provisional" value={el.tono} onChange={(v) => set({ tono: v })} opciones={TONOS} vacio="—" hint="Se ve mientras no haya archivo" />
        </Panel>
      )}

      {el.tipo === "imagen" && (
        <Panel
          titulo="Estilo de la imagen"
          plegable
          abierto={!!(el.molde || el.filtro || el.capa || el.sombra || el.borde)}
          resumen={[el.molde && "molde", el.filtro, el.capa && "capa", el.sombra && "sombra", el.borde && "borde"].filter(Boolean).join(", ") || "Sin estilo"}
        >
          <CampoMolde value={el.molde} onChange={(m) => set({ molde: m })} />
          <div className="grid grid-cols-2 gap-3">
            <Selector label="Filtro de color" value={el.filtro} onChange={(v) => set({ filtro: v })} opciones={FILTROS_IMAGEN_IDS.map((id) => ({ valor: id, etiqueta: FILTROS_IMAGEN[id].nombre }))} vacio="Ninguno" />
            <Selector label="Capa encima" value={el.capa} onChange={(v) => set({ capa: v })} opciones={CAPAS_IMAGEN_IDS.map((id) => ({ valor: id, etiqueta: CAPAS_IMAGEN[id].nombre }))} vacio="Ninguna" hint="El degradado oscuro ayuda a leer un texto puesto encima" />
            <Selector label="Sombra" value={el.sombra} onChange={(v) => set({ sombra: v })} opciones={SOMBRAS_IDS.map((id) => ({ valor: id, etiqueta: SOMBRAS[id].nombre }))} vacio="Sin sombra" />
            <Numero label="Grosor del borde" value={el.borde} onChange={(v) => set({ borde: v || undefined }, "borde")} min={0} />
          </div>
          {el.borde ? <CampoColor label="Color del borde" value={el.colorBorde ?? "tinta"} onChange={(v) => set({ colorBorde: v })} /> : null}
        </Panel>
      )}

      {el.tipo === "imagen" && <PanelGlobos globos={el.globos ?? []} sel={globoSel ?? null} onSel={(i) => onGloboSel?.(i)} onChange={(g, clave) => set({ globos: g.length ? g : undefined }, clave)} />}

      {el.tipo === "video" && (
        <Panel titulo="Video" plegable>
          <VideoEditor
            value={el}
            onChange={(v) => {
              // Conserva la geometría del elemento; solo cambian los datos del video.
              const { src, youtube, vimeo, poster, pie, animado } = v;
              set({ src, youtube, vimeo, poster, pie, animado });
            }}
          />
          <Numero label="Esquinas redondas" value={el.radio} onChange={(v) => set({ radio: v }, "radio")} min={0} />
          <CampoMolde value={el.molde} onChange={(m) => set({ molde: m })} />
        </Panel>
      )}

      {el.tipo === "icono" && (
        <Panel titulo="Icono" plegable>
          <div className="flex items-center gap-3">
            <span className="block h-12 w-12 shrink-0 border border-ink/20 bg-white/60 dark:bg-white/5 p-2">
              <IconoSvg icono={el.icono} color={el.color} trazo={el.trazo} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans truncate text-sm font-bold">{ICONOS[el.icono]?.nombre ?? el.icono}</p>
              <p className="font-sans text-[0.7rem] text-ink-soft">{ICONOS[el.icono]?.categoria}</p>
            </div>
            {acciones.cambiarIcono && (
              <button type="button" className={btnCls} onClick={acciones.cambiarIcono}>
                Cambiar…
              </button>
            )}
          </div>
          <CampoColor label="Color" value={el.color ?? "tinta"} onChange={(v) => set({ color: v })} />
          {ICONOS[el.icono]?.estilo !== "relleno" && (
            <Numero label="Grosor del trazo (×10)" value={Math.round((el.trazo ?? 2) * 10)} onChange={(v) => set({ trazo: v ? v / 10 : undefined }, "trazo")} min={3} max={60} />
          )}
          <Texto label="Descripción (accesibilidad)" value={el.alt} onChange={(v) => set({ alt: v }, "alt")} placeholder={ICONOS[el.icono]?.nombre} />
        </Panel>
      )}

      {el.tipo === "forma" && (
        <Panel titulo="Forma" plegable>
          <Selector label="Forma" value={el.forma ?? "rectangulo"} onChange={(v) => set({ forma: v })} opciones={FORMAS.map((f) => ({ valor: f, etiqueta: f === "elipse" ? "Elipse / círculo" : "Rectángulo" }))} />
          <CampoColor label="Relleno" value={el.color ?? "tinta"} onChange={(v) => set({ color: v })} />
          <CampoMolde value={el.molde} onChange={(m) => set({ molde: m })} />
          <div className="grid grid-cols-2 gap-3">
            <Numero label="Grosor del borde" value={el.borde} onChange={(v) => set({ borde: v }, "borde")} min={0} />
            <Numero label="Esquinas redondas" value={el.radio} onChange={(v) => set({ radio: v }, "radio")} min={0} />
          </div>
          {el.borde ? <CampoColor label="Color del borde" value={el.colorBorde ?? "tinta"} onChange={(v) => set({ colorBorde: v })} /> : null}
        </Panel>
      )}

      <Panel titulo="Posición y tamaño" plegable resumen={`${Math.round(el.x)}, ${Math.round(el.y)} · ${Math.round(el.w)}×${Math.round(el.h)}`}>
        <div className="grid grid-cols-2 gap-3">
          <Numero label="X" value={Math.round(el.x)} onChange={(v) => set({ x: v ?? 0 }, "x")} />
          <Numero label="Y" value={Math.round(el.y)} onChange={(v) => set({ y: v ?? 0 }, "y")} />
          <Numero label="Ancho" value={Math.round(el.w)} onChange={(v) => set({ w: Math.max(1, v ?? 1) }, "w")} min={1} />
          <Numero label="Alto" value={Math.round(el.h)} onChange={(v) => set({ h: Math.max(1, v ?? 1) }, "h")} min={1} />
          <Numero label="Giro (°)" value={Math.round(el.rot ?? 0)} onChange={(v) => set({ rot: v ? v : undefined }, "rot")} min={-360} max={360} />
          <Numero
            label="Opacidad (%)"
            value={Math.round((el.opacidad ?? 1) * 100)}
            onChange={(v) => set({ opacidad: v === undefined || v >= 100 ? undefined : Math.max(0, v) / 100 }, "opacidad")}
            min={0}
            max={100}
          />
        </div>
        <Interruptor label="🔒 Bloqueado (no se mueve por accidente)" value={el.bloqueado ?? false} onChange={(v) => set({ bloqueado: v || undefined })} />
        <Interruptor label="🚫 Oculto (no se ve en la página publicada)" value={el.oculto ?? false} onChange={(v) => set({ oculto: v || undefined })} />
      </Panel>


      <Panel
        titulo="Dato con fecha"
        plegable
        abierto={el.dato !== undefined}
        resumen={el.dato ? el.dato.fecha : "Sin fecha"}
        ayuda="Para cifras, precios o noticias que envejecen: anota de cuándo es el dato y de dónde salió. El revisor avisa cuando pasan días de más antes de publicar."
      >
        <Interruptor label="Este elemento es un dato que envejece" value={el.dato !== undefined} onChange={(v) => set({ dato: v ? { fecha: new Date().toISOString().slice(0, 10) } : undefined })} />
        {el.dato && (
          <>
            <Campo label="Fecha del dato">
              <input className={inputCls} type="date" value={el.dato.fecha} onChange={(e) => e.target.value && set({ dato: { ...el.dato!, fecha: e.target.value } }, "dato")} />
            </Campo>
            <Texto label="Fuente" value={el.dato.fuente} onChange={(v) => set({ dato: { ...el.dato!, fuente: v || undefined } }, "dato")} placeholder="INEGI, Uno TV… (con enlace si lo tienes)" />
            <Campo label="Vale por (días)">
              <input
                className={inputCls}
                type="number"
                min={1}
                max={365}
                value={el.dato.dias ?? 7}
                onChange={(e) => set({ dato: { ...el.dato!, dias: Math.min(365, Math.max(1, Number(e.target.value) || 7)) } }, "dato")}
              />
            </Campo>
            <button type="button" className="font-sans w-full border border-ink px-2 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper" onClick={() => set({ dato: { ...el.dato!, fecha: new Date().toISOString().slice(0, 10) } })}>
              ✓ Verificado hoy
            </button>
          </>
        )}
      </Panel>
      <Panel titulo="Enlace" plegable abierto={el.enlace !== undefined} resumen={el.enlace === undefined ? "Sin enlace" : typeof el.enlace === "number" ? `Página ${el.enlace}` : el.enlace.slice(0, 30)} ayuda="Al hacer clic en el elemento (en el sitio publicado).">
        <SelectorDestino enlace={el.enlace} paginas={paginas} anclas={anclas} onChange={(enlace) => set({ enlace })} />
        {(tipoDestino(el.enlace) === "externo" || tipoDestino(el.enlace) === "ruta") && typeof el.enlace === "string" && (
          <Texto label="Dirección" value={el.enlace} onChange={(v) => set({ enlace: v || undefined }, "enlace")} placeholder="https://…" />
        )}
      </Panel>

      <Panel titulo="Animación de entrada" plegable abierto={!!el.animacion} resumen={el.animacion ? EFECTOS[el.animacion.efecto].nombre.replace(/ \(.*/, "") : "Ninguna"} ayuda="Se reproduce cuando el elemento entra en pantalla en la página publicada.">
        <Selector
          label="Efecto"
          value={el.animacion?.efecto}
          onChange={(v) => {
            set({ animacion: v ? { ...el.animacion, efecto: v } : undefined });
            if (v) acciones.probarAnimacion?.();
          }}
          opciones={EFECTOS_IDS.filter((id) => el.tipo === "texto" || !esEfectoTexto(id)).map((id) => ({ valor: id, etiqueta: EFECTOS[id].nombre }))}
          vacio="Ninguna"
        />
        {el.animacion && esEfectoTexto(el.animacion.efecto) && (
          <p className="font-sans text-[0.7rem] text-ink-soft">
            En estos efectos la <strong>duración</strong> es el tiempo de toda la escritura; déjala vacía para que dependa del largo del texto.
          </p>
        )}
        {el.animacion && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Numero label="Duración (ms)" value={el.animacion.duracion ?? (esEfectoTexto(el.animacion.efecto) ? undefined : 700)} onChange={(v) => set({ animacion: { ...el.animacion, efecto: el.animacion!.efecto, duracion: v } }, "anim-duracion")} min={50} max={6000} />
              <Numero label="Retraso (ms)" value={el.animacion.retraso ?? 0} onChange={(v) => set({ animacion: { ...el.animacion, efecto: el.animacion!.efecto, retraso: v || undefined } }, "anim-retraso")} min={0} max={20000} />
            </div>
            <button type="button" className={btnCls} onClick={acciones.probarAnimacion}>
              ▶ Probar
            </button>
          </>
        )}
      </Panel>


      <Panel titulo="Efectos de movimiento" plegable abierto={!!(el.hover || el.bucle || (el.tipo === "imagen" && el.parallax))} resumen={el.hover || el.bucle || (el.tipo === "imagen" && el.parallax) ? [el.hover && `cursor: ${el.hover}`, el.bucle, el.tipo === "imagen" && el.parallax && `parallax ${el.parallax}`].filter(Boolean).join(" · ") : "Ninguno"} ayuda="Se ven en el sitio publicado y en la vista previa (no mientras editas). El movimiento continuo se apaga solo si el lector pidió menos animaciones en su equipo.">
        <Selector
          label="Al pasar el cursor"
          value={el.hover}
          onChange={(v) => set({ hover: v })}
          opciones={HOVERS_IDS.map((id) => ({ valor: id, etiqueta: HOVERS[id] }))}
          vacio="Ninguno"
        />
        <Selector
          label="Movimiento continuo"
          value={el.bucle}
          onChange={(v) => set({ bucle: v })}
          opciones={BUCLES_IDS.map((id) => ({ valor: id, etiqueta: BUCLES[id] }))}
          vacio="Ninguno"
        />
        {el.tipo === "imagen" && (
          <Selector
            label="Parallax al hacer scroll"
            value={el.parallax}
            onChange={(v) => set({ parallax: v })}
            opciones={PARALLAX_IDS.map((id) => ({ valor: id, etiqueta: PARALLAX[id].nombre }))}
            vacio="Sin parallax"
            hint="La foto se mueve más lento que la página, dentro de su marco (se amplía un poco para poder moverse). Funciona mejor en fotos grandes y anchas."
          />
        )}
      </Panel>


      <Panel titulo="Revelar al tocar" plegable abierto={!!el.revelar} resumen={el.revelar ? `«${el.revelar.slice(0, 26)}»` : "No"} ayuda="El elemento queda tapado hasta que el lector lo toca (por ejemplo, la respuesta de una trivia). Se ve así en el sitio publicado y en la vista previa.">
        <Texto label="Texto de la tapa" value={el.revelar} onChange={(v) => set({ revelar: v || undefined }, "revelar")} placeholder="Toca para ver la respuesta" hint="Déjalo vacío para que el elemento se vea siempre" />
      </Panel>

      <Panel titulo="En el celular" plegable abierto={el.movil !== undefined || el.espacioMovil !== undefined} resumen={el.movil === "ocultar" ? "Oculto" : el.movil === "solo" ? "Solo celular" : el.espacioMovil !== undefined ? `Espacio ${el.espacioMovil}` : "Automático"} ayuda="Solo cuenta si la página usa “Apilar los elementos en una columna”.">
        <Selector
          label="Mostrar en la columna"
          value={el.movil}
          onChange={(v) => set({ movil: v })}
          opciones={[
            { valor: "mostrar", etiqueta: "Siempre mostrar" },
            { valor: "ocultar", etiqueta: "Ocultar en el celular" },
            { valor: "solo", etiqueta: "Solo en el celular (no se ve en la hoja de escritorio)" },
          ]}
          vacio="Automático (se ocultan fondos y formas gruesas)"
        />
        <Numero
          label="Espacio antes de este elemento (vacío = automático)"
          value={el.espacioMovil}
          onChange={(v) => set({ espacioMovil: v === undefined ? undefined : Math.min(400, Math.max(0, Math.round(v))) }, "espacioMovil")}
          min={0}
          max={400}
        />
      </Panel>
    </div>
  );
}

/* -------------------------------- Página ----------------------------- */

export function InspectorPagina({
  pagina,
  onChange,
  onProbarTodo,
  repetidos,
}: {
  pagina: Pagina;
  onChange: (p: Pagina) => void;
  /** Cuántos elementos repetidos tiene la edición (si hay, se ofrece omitirlos en esta página). */
  repetidos?: number;
  /** Reproduce las animaciones de todos los elementos de la página. */
  onProbarTodo?: () => void;
}) {
  const set = <K extends keyof Pagina>(k: K, v: Pagina[K] | undefined) => onChange({ ...pagina, [k]: v });
  const opciones: { valor: Transicion; etiqueta: string }[] = [
    { valor: "izquierda", etiqueta: "Izquierda — la hoja se pasa hacia la izquierda" },
    { valor: "derecha", etiqueta: "Derecha — la hoja se pasa hacia la derecha" },
    { valor: "arriba", etiqueta: "Arriba — la hoja se levanta" },
    { valor: "abajo", etiqueta: "Abajo — la hoja cae" },
    { valor: "fundido", etiqueta: "Fundido — la hoja se desvanece" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-sans mr-auto text-xs font-bold uppercase tracking-wider">Esta página</h3>
        <ControlPaneles />
      </div>
      <Panel titulo="Hoja" plegable>
        <CampoColor label="Color de fondo" value={pagina.fondo ?? "papel"} onChange={(v) => set("fondo", v)} />
        <Numero label="Alto de la hoja (el ancho siempre es 800)" value={pagina.alto ?? 1100} onChange={(v) => set("alto", v)} min={200} max={8000} />
        <Selector
          label="En el celular"
          value={pagina.movil ?? "escala"}
          onChange={(v) => set("movil", v === "apilar" ? "apilar" : undefined)}
          opciones={[
            { valor: "escala", etiqueta: "Reducir la hoja entera" },
            { valor: "apilar", etiqueta: "Apilar los elementos en una columna" },
          ]}
          hint="Mira el resultado en la pestaña “Celular” de la derecha."
        />
        <p className="font-sans text-[0.7rem] text-ink-soft">
          Con “Reducir la hoja”, el texto se encoge con ella: para el cuerpo usa 22 o más.
        </p>
        {repetidos ? (
          <Interruptor label={`Mostrar los ${repetidos} elementos repetidos en esta página`} value={!pagina.sinMaestra} onChange={(v) => set("sinMaestra", v ? undefined : true)} />
        ) : null}
      </Panel>
      {onProbarTodo && (
        <Panel titulo="Animaciones" plegable abierto={false} resumen={`${(pagina.elementos ?? []).filter((e) => e.animacion).length} animados`} ayuda="Cada elemento puede tener su animación de entrada (en sus propiedades).">
          <button type="button" className={btnCls} onClick={onProbarTodo} disabled={!(pagina.elementos ?? []).some((e) => e.animacion)}>
            ▶ Probar las animaciones de la página
          </button>
          <p className="font-sans text-[0.7rem] text-ink-soft">
            {(pagina.elementos ?? []).filter((e) => e.animacion).length} de {(pagina.elementos ?? []).length} elementos animados.
          </p>
        </Panel>
      )}
      <Panel titulo="Transición" plegable abierto={false} resumen={pagina.transicion} ayuda="Cómo ENTRA esta página al avanzar. Al retroceder se usa la opuesta.">
        <Selector label="Giro de página" value={pagina.transicion} onChange={(v) => set("transicion", v ?? "izquierda")} opciones={opciones} />
        <p className="font-sans text-[0.7rem] text-ink-soft">Opciones: {TRANSICIONES.join(", ")}.</p>
      </Panel>
      <Panel titulo="Índice" plegable abierto={false} resumen={pagina.enIndice === false ? "No aparece" : pagina.titulo} ayuda="La página “Índice” (plantilla) usa estos datos.">
        <Texto label="Título en el índice" value={pagina.titulo} onChange={(v) => set("titulo", v)} />
        <Texto label="Sección" value={pagina.seccion} onChange={(v) => set("seccion", v)} />
        <Area label="Resumen" value={pagina.bajada} onChange={(v) => set("bajada", v)} rows={2} />
        <Interruptor label="Mostrar en el índice" value={pagina.enIndice !== false} onChange={(v) => set("enIndice", v ? undefined : false)} />
      </Panel>
    </div>
  );
}

/* ------------------------- Texto sobre la imagen ------------------------- */

const ETIQUETAS_FORMA: Record<(typeof FORMAS_GLOBO)[number], string> = {
  globo: "Globo de diálogo",
  pensamiento: "Pensamiento (ovalado)",
  recuadro: "Recuadro (narración)",
  sonido: "Sonido (efecto)",
  tapa: "Parche liso (tapa el texto original)",
};
const ETIQUETAS_COLA: Record<(typeof COLAS_GLOBO)[number], string> = {
  ninguna: "Sin cola",
  "abajo-izquierda": "Abajo a la izquierda",
  "abajo-derecha": "Abajo a la derecha",
  "arriba-izquierda": "Arriba a la izquierda",
  "arriba-derecha": "Arriba a la derecha",
};

/** Escribe texto encima de una imagen (globos de cómic, rótulos, parches que tapan letras originales y traducciones). Medidas en % de la imagen. */
function PanelGlobos({ globos, sel, onSel, onChange }: { globos: Globo[]; sel: number | null; onSel: (i: number | null) => void; onChange: (g: Globo[], clave?: string) => void }) {
  const i = sel !== null && sel < globos.length ? sel : null;
  const g = i !== null ? globos[i] : null;
  const poner = (patch: Partial<Globo>, clave?: string) => i !== null && onChange(globos.map((x, k) => (k === i ? { ...x, ...patch } : x)), clave ? `globo${i}:${clave}` : undefined);
  const nuevo = (base?: Partial<Globo>) => {
    onChange([...globos, { x: 10, y: 10, w: 40, h: 14, texto: "Nuevo texto", tam: 3, ...base }]);
    onSel(globos.length);
  };
  return (
    <Panel titulo="Texto sobre la imagen" plegable abierto={globos.length > 0} resumen={globos.length ? `${globos.length} globo(s)` : "Ninguno"} ayuda="Globos, rótulos y parches dibujados encima de la imagen, con letra de verdad (editable). Sirven para traducir un cómic: un parche tapa el texto original y un globo escribe la traducción. Selecciona la imagen sola para moverlos con el puntero.">
      <div className="flex flex-wrap gap-1">
        <button type="button" className={btnCls} onClick={() => nuevo()}>+ Globo</button>
        <button type="button" className={btnCls} onClick={() => nuevo({ forma: "recuadro", texto: "Narración", w: 60, h: 8 })}>+ Recuadro</button>
        <button type="button" className={btnCls} onClick={() => nuevo({ forma: "tapa", texto: "", fondo: "#ffffff", w: 25, h: 8 })}>+ Parche</button>
      </div>
      {globos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {globos.map((x, k) => (
            <button key={k} type="button" className={btnCls} style={k === i ? { borderColor: "#068562", fontWeight: 700 } : undefined} onClick={() => onSel(k)}>
              {k + 1}. {(x.texto || (x.forma === "tapa" ? "Parche" : "—")).slice(0, 14)}
            </button>
          ))}
        </div>
      )}
      {g && i !== null && (
        <div className="space-y-3 border-t border-dashed pt-3">
          <Area label="Texto" value={g.texto} onChange={(v) => poner({ texto: v }, "texto")} rows={3} />
          <Selector label="Forma" value={g.forma ?? "globo"} onChange={(v) => poner({ forma: v })} opciones={FORMAS_GLOBO.map((f) => ({ valor: f, etiqueta: ETIQUETAS_FORMA[f] }))} />
          {(g.forma ?? "globo") === "globo" && (
            <Selector label="Cola" value={g.cola ?? "abajo-izquierda"} onChange={(v) => poner({ cola: v })} opciones={COLAS_GLOBO.map((c) => ({ valor: c, etiqueta: ETIQUETAS_COLA[c] }))} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Numero label="X (%)" value={g.x} onChange={(v) => poner({ x: v ?? 0 }, "x")} />
            <Numero label="Y (%)" value={g.y} onChange={(v) => poner({ y: v ?? 0 }, "y")} />
            <Numero label="Ancho (%)" value={g.w} onChange={(v) => poner({ w: Math.max(1, v ?? 1) }, "w")} min={1} />
            <Numero label="Alto (%)" value={g.h} onChange={(v) => poner({ h: Math.max(1, v ?? 1) }, "h")} min={1} />
            <Numero label="Tamaño de letra" value={g.tam ?? 3} onChange={(v) => poner({ tam: v === undefined ? undefined : Math.min(30, Math.max(0.5, v)) }, "tam")} min={0.5} max={30} />
          </div>
          <Selector label="Letra" value={g.fuente ?? "comicneue"} onChange={(v) => poner({ fuente: v })} opciones={FUENTES.map((f) => ({ valor: f, etiqueta: FUENTES_INFO[f].nombre }))} />
          <div className="grid grid-cols-2 gap-3">
            <CampoColor label="Fondo" value={g.fondo} onChange={(v) => poner({ fondo: v })} vacio="Crema" />
            <CampoColor label="Color del texto" value={g.color} onChange={(v) => poner({ color: v })} vacio="Tinta" />
          </div>
          <Interruptor label="Todo en mayúsculas" value={!!g.mayusculas} onChange={(v) => poner({ mayusculas: v || undefined })} />
          <div className="flex gap-1">
            <button type="button" className={btnCls} onClick={() => { onChange([...globos, { ...g, x: g.x + 2, y: g.y + 2 }]); onSel(globos.length); }}>⧉ Duplicar</button>
            <button type="button" className={btnCls} onClick={() => { onChange(globos.filter((_, k) => k !== i)); onSel(null); }}>✕ Quitar</button>
          </div>
        </div>
      )}
    </Panel>
  );
}
