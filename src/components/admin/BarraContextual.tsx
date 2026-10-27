"use client";

import { useContext, useEffect, useRef, useState } from "react";
import {
  ALINEACIONES,
  DEGRADADOS,
  DEGRADADOS_IDS,
  FILTROS_IMAGEN,
  FILTROS_IMAGEN_IDS,
  CATEGORIAS_FUENTE,
  FUENTES,
  FUENTES_INFO,
  SOMBRAS_TEXTO,
  SOMBRAS_TEXTO_IDS,
  colorCss,
  type Alineacion,
  type DegradadoId,
  type Elemento,
  type Fuente,
  type Pagina,
} from "@/lib/esquema";
import PaletaColores, { ALTO_MENU } from "./PaletaColores";
import { EstilosEdicionContext } from "./ContextosEdicion";

/**
 * Barra contextual sobre la hoja (al estilo de Canva): lo que más se usa del elemento elegido, a un clic. Para lo demás (animaciones, enlace,
 * posición y tamaño, estilos finos) hay botones que abren el panel correspondiente de la derecha.
 */

type Alineacion6 = "izq" | "cen" | "der" | "sup" | "med" | "inf";

type Acciones = {
  duplicar: () => void;
  eliminar: () => void;
  frente: () => void;
  atras: () => void;
  agrupar?: () => void;
  desagrupar?: () => void;
  /** Foto: encuadrar con el ratón, quitar el fondo, cambiar por otra de «Subidos». */
  recortar?: () => void;
  quitarFondo?: () => void;
  reemplazarImagen?: () => void;
  /** Texto: entrar a editar el contenido. */
  editarTexto?: () => void;
  /** Icono / figura: elegir otra. */
  cambiarIcono?: () => void;
  /** Estilos con nombre de la edición (aún sin conectar en EditorLienzo). */
  aplicarEstilo?: (indice: number) => void;
  guardarEstilo?: () => void;
};

const TAMANOS_RAPIDOS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 60, 72, 96];
/** Icono de alineación de párrafo: cuatro líneas de distinto largo pegadas a un lado, centradas o parejas. */
function IconoAlinear({ a }: { a: Alineacion }) {
  const largos = a === "justificado" ? [12, 12, 12, 12] : [12, 8, 12, 6];
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      {largos.map((w, i) => (
        <rect key={i} x={a === "izquierda" || a === "justificado" ? 2 : a === "derecha" ? 14 - w : 8 - w / 2} y={2.5 + i * 3.2} width={w} height="1.6" rx="0.8" />
      ))}
    </svg>
  );
}
const ALINEAR_TITULO: Record<Alineacion, string> = { izquierda: "Alinear a la izquierda", centro: "Centrar", derecha: "Alinear a la derecha", justificado: "Justificar" };

const btn = (activo = false) =>
  `font-sans inline-flex h-8 min-w-8 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 text-xs font-semibold transition-colors disabled:opacity-35 ${
    activo ? "border-ink bg-ink text-paper" : "border-transparent text-ink hover:bg-ink/10"
  }`;

const Sep = () => <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-ink/20" />;

/** Cierra un menú al tocar fuera de él. */
function useFuera(abierto: boolean, cerrar: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: PointerEvent) => {
      if ((e.target as Element).closest?.("[data-no-cerrar]")) return; // capa del cuentagotas
      if (ref.current && !ref.current.contains(e.target as Node)) cerrar();
    };
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("pointerdown", alTocar);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("pointerdown", alTocar);
      document.removeEventListener("keydown", alTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  return ref;
}

/** Botón con menú desplegable (el contenido se dibuja debajo del botón). */
function Menu({ etiqueta, titulo, activo, children, ancho = "w-64" }: { etiqueta: React.ReactNode; titulo: string; activo?: boolean; children: React.ReactNode; ancho?: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useFuera(abierto, () => setAbierto(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" className={btn(abierto || activo)} title={titulo} aria-label={titulo} aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
        {etiqueta}
      </button>
      {abierto && <div data-paleta-flotante className={`absolute left-0 top-9 z-40 ${ancho} rounded-md border border-ink/40 bg-paper p-3 shadow-xl`}>{children}</div>}
    </div>
  );
}

/**
 * Campo del tamaño de letra. Se puede escribir un número completo (se aplica al salir del campo o con Enter; Esc lo deja como estaba);
 * con ↑ ↓ cambia de uno en uno. Antes cada tecla se aplicaba al instante y el mínimo (4) hacía imposible teclear «26».
 */
function CampoTamano({ valor, onCambiar }: { valor: number; onCambiar: (n: number) => void }) {
  const [borrador, setBorrador] = useState<string | null>(null);
  const aplicar = (texto: string) => {
    setBorrador(null);
    const n = Number(texto.replace(",", "."));
    if (texto.trim() !== "" && Number.isFinite(n)) onCambiar(Math.max(4, Math.min(400, Math.round(n))));
  };
  return (
    <input
      aria-label="Tamaño del texto"
      type="text"
      inputMode="numeric"
      value={borrador ?? String(valor)}
      list="tamanos-rapidos"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        // Una opción de la lista de tamaños llega como cambio completo: se aplica al momento.
        const v = e.target.value;
        const esOpcion = (e.nativeEvent as InputEvent).inputType === undefined || (e.nativeEvent as InputEvent).inputType === "insertReplacementText";
        if (esOpcion && /^\d+$/.test(v)) aplicar(v);
        else setBorrador(v.replace(/[^\d.,]/g, ""));
      }}
      onBlur={() => borrador !== null && aplicar(borrador)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (borrador !== null) aplicar(borrador);
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.stopPropagation();
          setBorrador(null);
          e.currentTarget.blur();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          onCambiar(Math.max(4, Math.min(400, valor + (e.key === "ArrowUp" ? 1 : -1))));
          setBorrador(null);
        }
      }}
      className="font-sans h-8 w-14 rounded-md border border-ink/25 bg-paper px-1.5 text-center text-xs font-semibold text-ink"
    />
  );
}

/** Muestra de color con menú de paleta (y color libre). `vacio`: ofrece «sin color» con ese texto. */
function ColorBoton({ valor, onChange, titulo, vacio, letra, degradado, onDegradado }: { valor: string | undefined; onChange: (v: string | undefined) => void; titulo: string; vacio?: string; letra?: boolean; degradado?: DegradadoId; onDegradado?: (id: DegradadoId | undefined) => void }) {
  return (
    <Menu
      titulo={titulo}
      ancho="w-72"
      etiqueta={
        letra ? (
          <span className="flex flex-col items-center leading-none">
            <span className="text-sm font-black">A</span>
            <span className="mt-0.5 h-1 w-4 rounded-sm border border-ink/30" style={{ background: valor ? colorCss(valor, "transparent") : "transparent" }} />
          </span>
        ) : (
          <span className="h-5 w-5 rounded border border-ink/40" style={{ background: valor ? colorCss(valor, "transparent") : "repeating-conic-gradient(#d9d9d9 0% 25%, #fff 0% 50%) 50% / 8px 8px" }} />
        )
      }
    >
      <p className="font-sans mb-2 text-[0.68rem] font-bold uppercase tracking-wide text-ink-soft">{titulo}</p>
      <div className={ALTO_MENU}>
        <PaletaColores valor={valor} onChange={onChange} vacio={vacio} degradado={degradado} onDegradado={onDegradado} />
      </div>
    </Menu>
  );
}

const selectCls = "font-sans h-8 rounded-md border border-ink/25 bg-paper px-1.5 text-xs font-semibold text-ink";

export default function BarraContextual({
  el,
  n,
  pagina,
  cambiar,
  cambiarPagina,
  onAlinear,
  acciones,
  abrirPanel,
}: {
  /** El elemento elegido (solo cuando hay exactamente uno). */
  el: Elemento | undefined;
  /** Cuántos elementos hay seleccionados. */
  n: number;
  pagina: Pagina;
  cambiar: (patch: Record<string, unknown>, clave?: string) => void;
  cambiarPagina: (patch: Partial<Pagina>) => void;
  onAlinear: (a: Alineacion6) => void;
  acciones: Acciones;
  /** Abre (y muestra) un panel del inspector por su título. */
  abrirPanel: (titulo: string) => void;
}) {
  /* --------------------- Nada seleccionado: la página --------------------- */
  if (n === 0) {
    return (
      <Barra etiqueta="Página">
        <span className="font-sans text-xs font-semibold text-ink-soft">Fondo</span>
        <ColorBoton valor={pagina.fondo ?? "papel"} onChange={(v) => cambiarPagina({ fondo: v ?? "papel" })} titulo="Color de fondo de la página" />
        <Sep />
        <label className="font-sans flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          Alto
          <input
            type="number"
            min={300}
            max={8000}
            step={10}
            value={pagina.alto ?? 1100}
            onChange={(e) => cambiarPagina({ alto: Math.max(300, Math.min(8000, Number(e.target.value) || 1100)) })}
            className="font-sans h-8 w-20 rounded-md border border-ink/25 bg-paper px-2 text-xs text-ink"
          />
        </label>
        <Sep />
        <button type="button" className={btn()} onClick={() => abrirPanel("Transición")} title="Cómo entra esta página">
          ⇄ Transición
        </button>
        <button type="button" className={btn()} onClick={() => abrirPanel("Animaciones")} title="Animaciones de la página">
          ✨ Animaciones
        </button>
        <span className="font-sans ml-auto hidden text-[0.7rem] text-ink-soft xl:inline">Elige algo en la hoja para ver aquí sus ajustes.</span>
      </Barra>
    );
  }

  /* ------------------------------ Varios elementos ------------------------------ */
  if (!el) {
    return (
      <Barra etiqueta={`${n} elementos`}>
        {(
          [
            ["izq", "⇤", "Alinear a la izquierda"],
            ["cen", "↔", "Centrar horizontalmente"],
            ["der", "⇥", "Alinear a la derecha"],
            ["sup", "⤒", "Alinear arriba"],
            ["med", "↕", "Centrar verticalmente"],
            ["inf", "⤓", "Alinear abajo"],
          ] as const
        ).map(([a, i, t]) => (
          <button key={a} type="button" className={btn()} title={t} aria-label={t} onClick={() => onAlinear(a)}>
            {i}
          </button>
        ))}
        <Sep />
        {acciones.agrupar && (
          <button type="button" className={btn()} onClick={acciones.agrupar} title="Agrupar: se mueven y se cambian de tamaño juntos">
            ▣ Agrupar
          </button>
        )}
        {acciones.desagrupar && (
          <button type="button" className={btn()} onClick={acciones.desagrupar} title="Separar el grupo">
            ▢ Desagrupar
          </button>
        )}
        <Sep />
        <Comunes acciones={acciones} />
      </Barra>
    );
  }

  /* ------------------------------ Un elemento ------------------------------ */
  const etiqueta = el.tipo === "texto" ? "Texto" : el.tipo === "imagen" ? "Foto" : el.tipo === "video" ? "Video" : el.tipo === "forma" ? "Forma" : el.icono.startsWith("fig-") ? "Figura" : "Icono";
  return (
    <Barra etiqueta={etiqueta}>
      {el.tipo === "texto" && <ControlesTexto el={el} cambiar={cambiar} acciones={acciones} />}
      {el.tipo === "imagen" && <ControlesFoto el={el} cambiar={cambiar} acciones={acciones} abrirPanel={abrirPanel} />}
      {el.tipo === "forma" && <ControlesForma el={el} cambiar={cambiar} abrirPanel={abrirPanel} />}
      {el.tipo === "icono" && (
        <>
          <ColorBoton valor={el.color ?? "tinta"} onChange={(v) => cambiar({ color: v })} titulo="Color" />
          {acciones.cambiarIcono && (
            <button type="button" className={btn()} onClick={acciones.cambiarIcono} title="Elegir otra figura o icono">
              ⇄ Cambiar
            </button>
          )}
        </>
      )}
      <Sep />
      <Menu etiqueta={<span aria-hidden>◐</span>} titulo="Opacidad (transparencia)" ancho="w-56">
        <label className="font-sans block text-xs font-semibold text-ink-soft">
          Opacidad: {Math.round((el.opacidad ?? 1) * 100)} %
          <input type="range" min={0} max={100} value={Math.round((el.opacidad ?? 1) * 100)} onChange={(e) => cambiar({ opacidad: Number(e.target.value) >= 100 ? undefined : Number(e.target.value) / 100 }, "opacidad")} className="mt-2 w-full accent-[#068562]" />
        </label>
      </Menu>
      <button type="button" className={btn()} onClick={() => abrirPanel("Animación de entrada")} title="Animación de entrada (y de salida, y efectos de movimiento, en el panel de la derecha)">
        ✨ Animar
      </button>
      <button type="button" className={btn()} onClick={() => abrirPanel("Posición y tamaño")} title="Posición, tamaño y giro">
        ⤢ Posición
      </button>
      <button type="button" className={btn(el.enlace !== undefined)} onClick={() => abrirPanel("Enlace")} title="Hacer que lleve a otra página, a una dirección, a WhatsApp…">
        🔗 Enlace
      </button>
      <Sep />
      <Comunes acciones={acciones} />
    </Barra>
  );
}

/** Contenedor de la barra: una franja con la etiqueta de lo que se está editando. */
function Barra({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div role="toolbar" data-tour="barra" aria-label="Ajustes de lo seleccionado" className="font-sans mb-1.5 flex min-h-11 flex-wrap items-center gap-0.5 rounded-lg border border-ink/20 bg-paper px-2 py-1 shadow-sm">
      <span className="mr-2 rounded bg-ink/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{etiqueta}</span>
      {children}
    </div>
  );
}

/** Estilos con nombre de la edición: aplica uno al elemento elegido o guarda el aspecto de este como estilo nuevo. */
function MenuEstilos({ el, acciones }: { el: Elemento; acciones: Acciones }) {
  const ctx = useContext(EstilosEdicionContext);
  if (!ctx || !acciones.aplicarEstilo || !acciones.guardarEstilo) return null;
  const propios = ctx.estilos.map((e, i) => ({ e, i })).filter(({ e }) => e.tipo === el.tipo);
  return (
    <Menu etiqueta={<span>🎨 Estilos</span>} titulo="Estilos de la edición: aplicar uno o guardar el de este elemento" ancho="w-64">
      <p className="font-sans mb-2 text-[0.68rem] font-bold uppercase tracking-wide text-ink-soft">Estilos de {el.tipo === "texto" ? "texto" : el.tipo === "imagen" ? "imagen" : el.tipo === "forma" ? "forma" : el.tipo}</p>
      {propios.length === 0 ? (
        <p className="font-sans mb-2 text-xs italic text-ink-soft">Aún no hay. Deja este elemento como quieras y guárdalo abajo para reusarlo.</p>
      ) : (
        <ul className="mb-2 space-y-1">
          {propios.map(({ e, i }) => (
            <li key={i} className="flex items-center gap-1">
              <button type="button" className={`${btn()} min-w-0 flex-1 justify-start !border-ink/25`} onClick={() => acciones.aplicarEstilo!(i)} title="Aplicar este estilo">
                <span className="truncate">{e.nombre}</span>
              </button>
              <button type="button" className={`${btn()} !px-1.5`} onClick={() => ctx.cambiar(ctx.estilos.filter((_, k) => k !== i))} title="Quitar este estilo" aria-label={`Quitar el estilo ${e.nombre}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className={`${btn()} w-full !border-ink/40`} onClick={acciones.guardarEstilo}>
        ＋ Guardar el estilo de este elemento…
      </button>
    </Menu>
  );
}

function Comunes({ acciones }: { acciones: Acciones }) {
  return (
    <>
      <button type="button" className={btn()} onClick={acciones.frente} title="Traer al frente" aria-label="Traer al frente">
        ⬆
      </button>
      <button type="button" className={btn()} onClick={acciones.atras} title="Enviar atrás" aria-label="Enviar atrás">
        ⬇
      </button>
      <button type="button" className={btn()} onClick={acciones.duplicar} title="Duplicar" aria-label="Duplicar">
        ⧉
      </button>
      <button type="button" className={`${btn()} hover:!bg-terracota/15`} onClick={acciones.eliminar} title="Eliminar (Supr)" aria-label="Eliminar">
        🗑
      </button>
    </>
  );
}

/* ------------------------------- Texto ------------------------------- */

function ControlesTexto({ el, cambiar, acciones }: { el: Elemento & { tipo: "texto" }; cambiar: (p: Record<string, unknown>, c?: string) => void; acciones: Acciones }) {
  const fuente = (el.fuente ?? "serif") as Fuente;
  const tam = el.tam ?? 24;
  const pesos = FUENTES_INFO[fuente].pesos;
  const negrita = (el.peso ?? 400) >= 600;
  const pesoNegrita = pesos.reduce((m, p) => (p > m ? p : m), pesos[0]);
  return (
    <>
      <select
        aria-label="Tipografía"
        className={`${selectCls} w-36`}
        value={fuente}
        onChange={(e) => {
          const f = e.target.value as Fuente;
          const disp = FUENTES_INFO[f].pesos;
          const actual = el.peso ?? 400;
          const peso = disp.includes(actual) ? actual : disp.reduce((m, p) => (Math.abs(p - actual) < Math.abs(m - actual) ? p : m), disp[0]);
          cambiar({ fuente: f, peso: peso === 400 ? undefined : peso });
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
      <Sep />
      <button type="button" className={btn()} title="Reducir el tamaño" aria-label="Reducir el tamaño" onClick={() => cambiar({ tam: Math.max(4, Math.round(tam) - (tam > 40 ? 4 : 2)) }, "tam")}>
        −
      </button>
      <CampoTamano valor={Math.round(tam)} onCambiar={(n) => cambiar({ tam: n }, "tam")} />
      <datalist id="tamanos-rapidos">
        {TAMANOS_RAPIDOS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <button type="button" className={btn()} title="Aumentar el tamaño" aria-label="Aumentar el tamaño" onClick={() => cambiar({ tam: Math.min(400, Math.round(tam) + (tam >= 40 ? 4 : 2)) }, "tam")}>
        +
      </button>
      <Sep />
      <ColorBoton valor={el.color ?? "tinta"} onChange={(v) => cambiar({ color: v })} titulo="Color del texto" letra degradado={el.degradado} onDegradado={(id) => cambiar({ degradado: id, anguloDegradado: id ? el.anguloDegradado : undefined })} />
      <button type="button" className={`${btn(negrita)} font-black`} title="Negrita" aria-pressed={negrita} onClick={() => cambiar({ peso: negrita ? undefined : pesoNegrita })}>
        B
      </button>
      <button type="button" className={`${btn(!!el.cursiva)} italic`} title="Cursiva" aria-pressed={!!el.cursiva} onClick={() => cambiar({ cursiva: el.cursiva ? undefined : true })}>
        I
      </button>
      <button type="button" className={btn(!!el.mayusculas)} title="Todo en mayúsculas" aria-pressed={!!el.mayusculas} onClick={() => cambiar({ mayusculas: el.mayusculas ? undefined : true })}>
        Aa
      </button>
      <Sep />
      {ALINEACIONES.map((a) => (
        <button key={a} type="button" className={btn((el.alinear ?? "izquierda") === a)} title={ALINEAR_TITULO[a]} aria-label={ALINEAR_TITULO[a]} onClick={() => cambiar({ alinear: a === "izquierda" ? undefined : a })}>
          <IconoAlinear a={a} />
        </button>
      ))}
      <Sep />
      <Menu etiqueta={<span>✦ Efectos</span>} titulo="Sombra y degradado del texto" activo={!!(el.sombraTexto || el.degradado)}>
        <label className="font-sans mb-3 block text-xs font-semibold text-ink-soft">
          Sombra
          <select className={`${selectCls} mt-1 w-full`} value={el.sombraTexto ?? ""} onChange={(e) => cambiar({ sombraTexto: e.target.value || undefined })}>
            <option value="">Sin sombra</option>
            {SOMBRAS_TEXTO_IDS.map((id) => (
              <option key={id} value={id}>
                {SOMBRAS_TEXTO[id].nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="font-sans block text-xs font-semibold text-ink-soft">
          Degradado en las letras
          <select className={`${selectCls} mt-1 w-full`} value={el.degradado ?? ""} onChange={(e) => cambiar({ degradado: e.target.value || undefined, anguloDegradado: e.target.value ? el.anguloDegradado : undefined })}>
            <option value="">Color liso</option>
            {DEGRADADOS_IDS.map((id) => (
              <option key={id} value={id}>
                {DEGRADADOS[id].nombre}
              </option>
            ))}
          </select>
        </label>
      </Menu>
      {acciones.editarTexto && (
        <button type="button" className={btn()} onClick={acciones.editarTexto} title="Editar el texto (también: doble clic)">
          ✎ Editar
        </button>
      )}
    </>
  );
}

/* -------------------------------- Foto -------------------------------- */

function ControlesFoto({ el, cambiar, acciones, abrirPanel }: { el: Elemento & { tipo: "imagen" }; cambiar: (p: Record<string, unknown>, c?: string) => void; acciones: Acciones; abrirPanel: (t: string) => void }) {
  return (
    <>
      {acciones.reemplazarImagen && (
        <button type="button" className={btn()} onClick={acciones.reemplazarImagen} title="Cambiar esta foto por otra de «Subidos»">
          ⇄ Reemplazar
        </button>
      )}
      {acciones.recortar && (
        <button type="button" className={btn()} onClick={acciones.recortar} title="Mover y acercar la foto dentro de su marco (también: doble clic)">
          ✂ Recortar
        </button>
      )}
      {acciones.quitarFondo && (
        <button type="button" className={btn()} onClick={acciones.quitarFondo} title="Quitar el fondo de un solo color">
          🪄 Quitar fondo
        </button>
      )}
      <Sep />
      <select aria-label="Filtro" className={`${selectCls} w-36`} value={el.filtro ?? ""} onChange={(e) => cambiar({ filtro: e.target.value || undefined })}>
        <option value="">Sin filtro</option>
        {FILTROS_IMAGEN_IDS.map((id) => (
          <option key={id} value={id}>
            {FILTROS_IMAGEN[id].nombre}
          </option>
        ))}
      </select>
      <button type="button" className={btn(!!(el.molde || el.radio || el.borde || el.sombra || el.capa))} onClick={() => abrirPanel("Estilo de la imagen")} title="Marco (molde), esquinas, borde, sombra y capa">
        ▢ Estilo
      </button>
    </>
  );
}

/* -------------------------------- Forma -------------------------------- */

function ControlesForma({ el, cambiar, abrirPanel }: { el: Elemento & { tipo: "forma" }; cambiar: (p: Record<string, unknown>, c?: string) => void; abrirPanel: (t: string) => void }) {
  return (
    <>
      <ColorBoton valor={el.color ?? "tinta"} onChange={(v) => cambiar({ color: v })} titulo="Color de relleno" degradado={el.degradado} onDegradado={(id) => cambiar({ degradado: id, anguloDegradado: id ? el.anguloDegradado : undefined })} />
      <select aria-label="Degradado" className={`${selectCls} w-32`} value={el.degradado ?? ""} onChange={(e) => cambiar({ degradado: e.target.value || undefined, anguloDegradado: e.target.value ? el.anguloDegradado : undefined })}>
        <option value="">Color liso</option>
        {DEGRADADOS_IDS.map((id) => (
          <option key={id} value={id}>
            {DEGRADADOS[id].nombre}
          </option>
        ))}
      </select>
      <Sep />
      <Menu etiqueta={<span>▭ Borde</span>} titulo="Borde y esquinas" activo={!!(el.borde || el.radio)}>
        <label className="font-sans mb-3 block text-xs font-semibold text-ink-soft">
          Grosor del borde: {el.borde ?? 0}
          <input type="range" min={0} max={30} value={el.borde ?? 0} onChange={(e) => cambiar({ borde: Number(e.target.value) || undefined }, "borde")} className="mt-1 w-full accent-[#068562]" />
        </label>
        <label className="font-sans mb-2 block text-xs font-semibold text-ink-soft">
          Esquinas redondas: {el.radio ?? 0}
          <input type="range" min={0} max={120} value={el.radio ?? 0} onChange={(e) => cambiar({ radio: Number(e.target.value) || undefined }, "radio")} className="mt-1 w-full accent-[#068562]" />
        </label>
        {el.borde ? (
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-semibold text-ink-soft">Color del borde</span>
            <ColorBoton valor={el.colorBorde ?? "tinta"} onChange={(v) => cambiar({ colorBorde: v })} titulo="Color del borde" />
          </div>
        ) : null}
      </Menu>
      <button type="button" className={btn(!!el.molde)} onClick={() => abrirPanel("Forma")} title="Forma, molde (marco) y más">
        ▢ Forma
      </button>
    </>
  );
}
