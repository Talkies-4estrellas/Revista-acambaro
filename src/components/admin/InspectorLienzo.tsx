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
  FUENTES,
  TONOS,
  colorCss,
  MOLDES,
  MOLDES_IDS,
  estiloMolde,
  type Elemento,
  type Fuente,
  type MoldeId,
  type Pagina,
  type Peso,
} from "@/lib/esquema";
import { EFECTOS, EFECTOS_IDS, type Efecto } from "@/lib/animaciones";
import { ICONOS } from "@/lib/iconos-datos";
import { IconoSvg } from "@/components/Lienzo";
import { useState } from "react";
import {
  Area,
  Campo,
  CampoArchivo,
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

export function InspectorElemento({
  el,
  cambiar,
  paginas,
  acciones,
}: {
  el: Elemento;
  /** `clave` agrupa ediciones seguidas del mismo campo en un solo paso de deshacer. */
  cambiar: (patch: Partial<Elemento>, clave?: string) => void;
  paginas: string[];
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
        <button type="button" className={btnCls} onClick={acciones.frente} title="Traer al frente">↥ Frente</button>
        <button type="button" className={btnCls} onClick={acciones.atras} title="Enviar atrás">↧ Atrás</button>
        <button type="button" className={btnCls} onClick={acciones.duplicar} title="Duplicar (Ctrl+D)">⧉</button>
        <button type="button" className={btnCls} onClick={acciones.eliminar} title="Eliminar (Supr)">✕</button>
      </div>

      <Panel titulo="Posición y tamaño">
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
      </Panel>

      {el.tipo === "texto" && (
        <Panel titulo="Texto">
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
          <CampoColor label="Fondo de la caja" value={el.fondo} onChange={(v) => set({ fondo: v })} vacio="Sin fondo" />
          <Numero label="Relleno interior" value={el.relleno} onChange={(v) => set({ relleno: v })} min={0} />
          {acciones.ajustarAlto && (
            <button type="button" className={btnCls} onClick={acciones.ajustarAlto}>
              Ajustar el alto al texto
            </button>
          )}
        </Panel>
      )}

      {el.tipo === "imagen" && (
        <Panel titulo="Imagen">
          <CampoArchivo label="Archivo" value={el.src} onChange={(v) => set({ src: v })} />
          <Texto label="Texto alternativo" value={el.alt} onChange={(v) => set({ alt: v }, "alt")} hint="Describe la imagen (accesibilidad)" />
          <div className="grid grid-cols-2 gap-3">
            <Selector label="Ajuste" value={el.ajuste ?? "cubrir"} onChange={(v) => set({ ajuste: v })} opciones={AJUSTES.map((a) => ({ valor: a, etiqueta: a === "cubrir" ? "Cubrir (recorta)" : "Contener (completa)" }))} />
            <Numero label="Esquinas redondas" value={el.radio} onChange={(v) => set({ radio: v }, "radio")} min={0} />
          </div>
          <CampoMolde value={el.molde} onChange={(m) => set({ molde: m })} />
          <Selector label="Color provisional" value={el.tono} onChange={(v) => set({ tono: v })} opciones={TONOS} vacio="—" hint="Se ve mientras no haya archivo" />
        </Panel>
      )}

      {el.tipo === "video" && (
        <Panel titulo="Video">
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
        <Panel titulo="Icono">
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
        <Panel titulo="Forma">
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

      <Panel titulo="En el celular" ayuda="Solo cuenta si la página usa “Apilar los elementos en una columna”.">
        <Selector
          label="Mostrar en la columna"
          value={el.movil}
          onChange={(v) => set({ movil: v })}
          opciones={[
            { valor: "mostrar", etiqueta: "Siempre mostrar" },
            { valor: "ocultar", etiqueta: "Ocultar en el celular" },
          ]}
          vacio="Automático (se ocultan fondos y formas gruesas)"
        />
      </Panel>

      <Panel titulo="Animación de entrada" ayuda="Se reproduce cuando el elemento entra en pantalla en la página publicada.">
        <Selector
          label="Efecto"
          value={el.animacion?.efecto}
          onChange={(v) => {
            set({ animacion: v ? { ...el.animacion, efecto: v } : undefined });
            if (v) acciones.probarAnimacion?.();
          }}
          opciones={EFECTOS_IDS.map((id) => ({ valor: id, etiqueta: EFECTOS[id].nombre }))}
          vacio="Ninguna"
        />
        {el.animacion && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Numero label="Duración (ms)" value={el.animacion.duracion ?? 700} onChange={(v) => set({ animacion: { ...el.animacion, efecto: el.animacion!.efecto, duracion: v } }, "anim-duracion")} min={50} max={6000} />
              <Numero label="Retraso (ms)" value={el.animacion.retraso ?? 0} onChange={(v) => set({ animacion: { ...el.animacion, efecto: el.animacion!.efecto, retraso: v || undefined } }, "anim-retraso")} min={0} max={20000} />
            </div>
            <button type="button" className={btnCls} onClick={acciones.probarAnimacion}>
              ▶ Probar
            </button>
          </>
        )}
      </Panel>

      <Panel titulo="Enlace" ayuda="Al hacer clic en el elemento (en el sitio publicado).">
        <Campo label="Lleva a">
          <select
            className={inputCls}
            value={typeof el.enlace === "number" ? String(el.enlace) : el.enlace === "/suscribirse" ? "suscribirse" : el.enlace ? "externo" : ""}
            onChange={(e) => {
              const v = e.target.value;
              set({ enlace: v === "" ? undefined : v === "externo" ? "https://" : v === "suscribirse" ? "/suscribirse" : Number(v) });
            }}
          >
            <option value="">Sin enlace</option>
            {paginas.map((t, i) => (
              <option key={i} value={i + 1}>
                Página {i + 1}: {t}
              </option>
            ))}
            <option value="suscribirse">Formulario de suscripción (newsletter)</option>
            <option value="externo">Dirección externa…</option>
          </select>
        </Campo>
        {typeof el.enlace === "string" && el.enlace !== "/suscribirse" && (
          <Texto label="Dirección" value={el.enlace} onChange={(v) => set({ enlace: v || undefined }, "enlace")} placeholder="https://…" />
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------- Página ----------------------------- */

export function InspectorPagina({
  pagina,
  onChange,
  onProbarTodo,
}: {
  pagina: Pagina;
  onChange: (p: Pagina) => void;
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
      <Panel titulo="Hoja">
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
      </Panel>
      {onProbarTodo && (
        <Panel titulo="Animaciones" ayuda="Cada elemento puede tener su animación de entrada (en sus propiedades).">
          <button type="button" className={btnCls} onClick={onProbarTodo} disabled={!(pagina.elementos ?? []).some((e) => e.animacion)}>
            ▶ Probar las animaciones de la página
          </button>
          <p className="font-sans text-[0.7rem] text-ink-soft">
            {(pagina.elementos ?? []).filter((e) => e.animacion).length} de {(pagina.elementos ?? []).length} elementos animados.
          </p>
        </Panel>
      )}
      <Panel titulo="Transición" ayuda="Cómo ENTRA esta página al avanzar. Al retroceder se usa la opuesta.">
        <Selector label="Giro de página" value={pagina.transicion} onChange={(v) => set("transicion", v ?? "izquierda")} opciones={opciones} />
        <p className="font-sans text-[0.7rem] text-ink-soft">Opciones: {TRANSICIONES.join(", ")}.</p>
      </Panel>
      <Panel titulo="Índice" ayuda="La página “Índice” (plantilla) usa estos datos.">
        <Texto label="Título en el índice" value={pagina.titulo} onChange={(v) => set("titulo", v)} />
        <Texto label="Sección" value={pagina.seccion} onChange={(v) => set("seccion", v)} />
        <Area label="Resumen" value={pagina.bajada} onChange={(v) => set("bajada", v)} rows={2} />
        <Interruptor label="Mostrar en el índice" value={pagina.enIndice !== false} onChange={(v) => set("enIndice", v ? undefined : false)} />
      </Panel>
    </div>
  );
}
