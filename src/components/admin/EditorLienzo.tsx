"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ElementoVista, IconoSvg } from "@/components/Lienzo";
import {
  ALTO_LIENZO,
  ANCHO_LIENZO,
  PRESETS,
  colorCss,
  esColorValido,
  elementoBoton,
  type ElementoGuardado,
  elementoFormaMolde,
  elementoIcono,
  elementoLogo,
  elementoMarco,
  elementoNuevo,
  type Elemento,
  type LogoId,
  type MoldeId,
  type Pagina,
  type PresetElemento,
} from "@/lib/esquema";
import { MediosContext, Panel, btnCls } from "./campos";
import { ejemploDe, esAltDeEjemplo } from "@/lib/ejemplos";
import { ColoresPaginaContext, CuentagotasContext, FotosPaginaContext } from "./PaletaColores";
import CuentagotasHoja from "./CuentagotasHoja";
import { useMenuContextual, type ItemMenu } from "./MenuContextual";
import { elementosBloque } from "@/lib/bloques";
import { animarTexto } from "@/lib/animaciones-texto";
import { aplicarEstilo, copiarEstilo, type EstiloCopiado } from "@/lib/estilo";
import { desplazarEnfoque } from "@/lib/recorte";
import QuitarFondo from "./QuitarFondo";
import PlantillasModal, { type ModoAplicar } from "./PlantillasModal";
import BarraContextual from "./BarraContextual";
import BibliotecaLienzo, { type ModoBiblioteca } from "./BibliotecaLienzo";
import { DESPUES_DEFECTO, fotogramas, fotogramasSalida, opcionesAnimacion, opcionesSalida, pruebaBucle, pruebaHover, type Bucle, type Efecto, type Hover } from "@/lib/animaciones";
import { CATALOGO } from "@/lib/catalogo-iconos";
import { mapaAnclas } from "@/lib/referencias";
import EditorTexto from "./EditorTexto";
import Reglas, { GROSOR_REGLA } from "./Reglas";
import VistaCelular from "./VistaCelular";
import { aCarga, desdeTexto, guardarInterno, leerInterno, pareceDeLaRevista, type Carga } from "./portapapeles";
import { desdeTextoPlano } from "./textoEnriquecido";
import { mensajeSimple } from "@/lib/errores-simples";
import {
  InspectorElemento,
  InspectorMultiple,
  InspectorPagina,
  PanelAlinear,
  type Alineacion6,
} from "./InspectorLienzo";

/** Reglas, cuadrícula e imanes: se recuerdan al cambiar de página y entre sesiones del panel. */
type Rejilla = { reglas: boolean; cuadricula: boolean; iman: boolean; paso: number };
const PASOS_REJILLA = [5, 10, 20, 25, 40, 50, 100];
const REJILLA_INICIAL: Rejilla = { reglas: false, cuadricula: false, iman: false, paso: 20 };
let rejillaRecordada: Rejilla = REJILLA_INICIAL;

function leerRejilla(): Rejilla | null {
  try {
    const r = JSON.parse(window.localStorage.getItem("revista-rejilla") ?? "null");
    if (r && typeof r.reglas === "boolean" && typeof r.cuadricula === "boolean" && typeof r.iman === "boolean" && PASOS_REJILLA.includes(r.paso)) return r;
  } catch {
    // sin almacenamiento: se usan los valores por defecto
  }
  return null;
}

/** Pestaña del panel lateral: se recuerda al cambiar de página (el editor se vuelve a montar en cada una). */
let lateralRecordado: "propiedades" | "celular" = "propiedades";
/** Cómo se ajusta la hoja al abrir una página: entera por defecto (como en Canva); si el usuario elige «Ancho», se recuerda al cambiar de página. */
let ajusteRecordado: "ancho" | "pagina" = "pagina";
const UMBRAL_PX = 6;
const MARGEN_VISTA = 32;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;
const ZOOMS = [25, 50, 75, 100, 125, 150, 200, 300, 400];
const TIPO_DND = "application/x-lienzo";

const Trazo = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
const Vector = ({ id }: { id: string }) => (
  <span className="block h-[26px] w-[26px]" aria-hidden>
    <IconoSvg icono={id} color="currentColor" />
  </span>
);

/** Herramientas del riel: las de `preset` agregan el elemento al instante; las de `modo` abren su panel con opciones. */
/** Panel de herramientas que estaba abierto (de la última hoja), para reabrirlo al cambiar de página. */
let peticionAtendida = 0;
let bibliotecaRecordada: { edicion: string; modo: ModoBiblioteca } | null = null;

const RIEL: { id: string; etiqueta: string; titulo: string; modo?: ModoBiblioteca; preset?: PresetElemento; icono: React.ReactNode }[] = [
  { id: "plantillas", etiqueta: "Plantillas", titulo: "Páginas ya diseñadas, y guardar la tuya como plantilla", modo: "plantillas", icono: <Trazo><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></Trazo> },
  { id: "elementos", etiqueta: "Elementos", titulo: "Figuras, formas, iconos, marcos, bloques, botones, logo y tus elementos guardados", modo: "elementos", icono: <Trazo><rect x="3" y="3" width="7" height="7" rx="1" /><circle cx="17.500" cy="6.500" r="3.500" /><path d="M3 21l4-7 4 7zM14 14h7v7h-7z" /></Trazo> },
  { id: "texto", etiqueta: "Texto", titulo: "Titular, párrafo y etiqueta", modo: "texto", icono: <Trazo><path d="M5 7V5h14v2M12 5v14M9 19h6" /></Trazo> },
  { id: "subidos", etiqueta: "Subidos", titulo: "Tus fotos y videos ya subidos: clic o arrastra a la hoja", modo: "subidos", icono: <Trazo><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97H17" /><path d="M12 12v8M9 15l3-3 3 3" /></Trazo> },
];

type Guias = { v: number[]; h: number[] };
type Caja = { l: number; t: number; r: number; b: number };
type Tirador = { sx: -1 | 0 | 1; sy: -1 | 0 | 1; cursor: string };
const TIRADORES: Tirador[] = [
  { sx: -1, sy: -1, cursor: "nwse-resize" },
  { sx: 0, sy: -1, cursor: "ns-resize" },
  { sx: 1, sy: -1, cursor: "nesw-resize" },
  { sx: 1, sy: 0, cursor: "ew-resize" },
  { sx: 1, sy: 1, cursor: "nwse-resize" },
  { sx: 0, sy: 1, cursor: "ns-resize" },
  { sx: -1, sy: 1, cursor: "nesw-resize" },
  { sx: -1, sy: 0, cursor: "ew-resize" },
];

const nuevoId = () => Math.random().toString(36).slice(2, 10);

/** Rectángulo que envuelve al elemento (si está girado, el de su silueta girada). */
function caja(el: Elemento): Caja {
  if (!el.rot) return { l: el.x, t: el.y, r: el.x + el.w, b: el.y + el.h };
  const th = (el.rot * Math.PI) / 180;
  const c = Math.abs(Math.cos(th));
  const s = Math.abs(Math.sin(th));
  const hw = (el.w * c + el.h * s) / 2;
  const hh = (el.w * s + el.h * c) / 2;
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  return { l: cx - hw, t: cy - hh, r: cx + hw, b: cy + hh };
}
const unir = (cs: Caja[]): Caja => ({
  l: Math.min(...cs.map((c) => c.l)),
  t: Math.min(...cs.map((c) => c.t)),
  r: Math.max(...cs.map((c) => c.r)),
  b: Math.max(...cs.map((c) => c.b)),
});
const cruza = (a: Caja, b: Caja) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

function resumen(el: Elemento) {
  switch (el.tipo) {
    case "texto":
      return `Texto — ${el.texto.replace(/\s+/g, " ").slice(0, 28) || "(vacío)"}`;
    case "imagen":
      return `Imagen${el.alt ? ` — ${el.alt}` : ""}`;
    case "video":
      return "Video";
    case "icono":
      return `Icono — ${CATALOGO[el.icono]?.nombre ?? el.icono}`;
    case "forma":
      return el.forma === "elipse" ? "Círculo" : el.h <= 8 || el.w <= 8 ? "Línea" : "Rectángulo";
  }
}

/** Elementos de referencia: atenuados, sin responder al ratón y sin tocar lo que hay debajo. */
function Fantasma({ elementos, refs }: { elementos: Elemento[]; refs?: { n: number; mapa: Map<string, number>; creditos?: string } }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0.5 }}>
      {elementos.map((el, i) => (
        <ElementoVista key={`f${i}`} el={{ ...el, id: `f${i}` }} refs={refs} miniatura />
      ))}
    </div>
  );
}

export default function EditorLienzo({
  pagina,
  onChange,
  paginas,
  anclas,
  indice,
  creditos,
  edicionId,
  onAplicarPlantilla,
  abrirPlantillas,
  reservaInferior = 0,
  onHistorial,
  fantasma,
  fantasmaDetras = false,
  etiquetaMover,
  onMover,
  repetidos,
}: {
  pagina: Pagina;
  onChange: (p: Pagina) => void;
  /** Edición abierta (los enlaces a números de página solo valen dentro de ella al pegar). */
  edicionId: string;
  /** Títulos de todas las páginas (para los enlaces). */
  paginas: string[];
  /** Identificador de cada página, si lo tiene (para enlaces que siguen a la página). */
  anclas?: (string | undefined)[];
  /** Posición (desde 0) de esta página en la edición: sirve para mostrar el número real de {n} y {p:…}. */
  indice?: number;
  /** Texto de {creditos}: los créditos de todas las imágenes de la edición. */
  creditos?: string;
  /** Abre las plantillas de página (se ofrece en la guía de la hoja vacía). */
  /** Usa una plantilla (en una página nueva o en la actual): lo hace el editor de la edición. */
  onAplicarPlantilla?: (pagina: Pagina, nombre: string, modo: ModoAplicar) => void;
  /** Cada vez que cambia, se abre el panel de plantillas (lo piden botones de fuera de la hoja). */
  abrirPlantillas?: number;
  /** Alto (en rem) que ocupa algo fijo bajo la hoja, como la tira de páginas, para que la hoja no se salga de la pantalla. */
  reservaInferior?: number;
  /** Avisa al editor si hay algo que deshacer o rehacer y le da las funciones: los botones están en su barra superior. `null` al desmontarse. */
  onHistorial?: (e: { puedeDeshacer: boolean; puedeRehacer: boolean; deshacer: () => void; rehacer: () => void } | null) => void;
  /** Elementos que se ven atenuados como referencia y no se pueden tocar (los repetidos de la edición, o la página actual al editar los repetidos). */
  fantasma?: Elemento[];
  /** Los de referencia se dibujan detrás de los elementos de esta hoja (por defecto, delante). */
  fantasmaDetras?: boolean;
  /** Botón de la barra para pasar la selección a otro lugar («Repetir en todas», «Solo en esta página»). */
  etiquetaMover?: string;
  onMover?: (elementos: Elemento[]) => void;
  /** Cuántos elementos repetidos tiene la edición (para ofrecer omitirlos en esta página). */
  repetidos?: number;
}) {
  const { subir } = useContext(MediosContext);
  const elementos = pagina.elementos ?? [];
  const alto = pagina.alto ?? ALTO_LIENZO;
  const refs = useMemo(
    () => (indice === undefined ? undefined : { n: indice + 1, mapa: mapaAnclas(anclas ?? []), creditos }),
    [indice, anclas, creditos],
  );

  const [sel, setSel] = useState<string[]>([]);
  const [rej, setRejEstado] = useState<Rejilla>(rejillaRecordada);
  const rejRef = useRef(rej);
  rejRef.current = rej;
  const setRej = (parcial: Partial<Rejilla>) => {
    const nuevo = { ...rejRef.current, ...parcial };
    rejillaRecordada = nuevo;
    rejRef.current = nuevo;
    setRejEstado(nuevo);
    try {
      window.localStorage.setItem("revista-rejilla", JSON.stringify(nuevo));
    } catch {
      // sin almacenamiento: solo se recuerda mientras dure la sesión
    }
  };
  // Al montar se recupera lo guardado (no antes, para no desajustar el HTML del servidor).
  useEffect(() => {
    const guardado = leerRejilla();
    if (guardado) {
      rejillaRecordada = guardado;
      rejRef.current = guardado;
      setRejEstado(guardado);
    }
  }, []);
  const [guiaTemp, setGuiaTemp] = useState<null | { eje: "v" | "h"; pos: number; indice: number | null; borrar: boolean }>(null);
  const [lateral, setLateralEstado] = useState<"propiedades" | "celular">(lateralRecordado);
  const setLateral = (v: "propiedades" | "celular") => {
    lateralRecordado = v;
    setLateralEstado(v);
  };
  // El panel abierto (Elementos, Plantillas, Subidos…) se recuerda al cambiar de página, como en Canva: la hoja de cada página es un editor nuevo.
  const [biblioteca, setBiblioteca] = useState<null | { modo: ModoBiblioteca; reemplazar?: boolean }>(() => (bibliotecaRecordada && bibliotecaRecordada.edicion === edicionId ? { modo: bibliotecaRecordada.modo } : null));
  useEffect(() => {
    bibliotecaRecordada = biblioteca ? { edicion: edicionId, modo: biblioteca.modo } : null;
  }, [biblioteca, edicionId]);
  // Botones de fuera de la hoja («▤ Plantillas» de la página) piden abrir el panel.
  useEffect(() => {
    if (abrirPlantillas && abrirPlantillas !== peticionAtendida) {
      peticionAtendida = abrirPlantillas; // (cada página crea un editor nuevo: sin esto, el panel se reabriría solo al cambiar de página)
      setBiblioteca({ modo: "plantillas" });
    }
  }, [abrirPlantillas]);
  // Cada vez que se dibuja, el editor se entera de si hay historial (se compara allá para no repetir avisos).
  useEffect(() => {
    onHistorial?.({ puedeDeshacer: pasado.current.length > 0, puedeRehacer: futuro.current.length > 0, deshacer, rehacer });
  });
  useEffect(() => () => onHistorial?.(null), []); // eslint-disable-line react-hooks/exhaustive-deps
  /** Foto que se está encuadrando con el ratón (arrastrar para mover, deslizador para acercar) y foto a la que se le quita el fondo. */
  const [recortando, setRecortando] = useState<string | null>(null);
  const recortandoRef = useRef<string | null>(null);
  recortandoRef.current = recortando;
  const [quitandoFondo, setQuitandoFondo] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [globoSel, setGloboSel] = useState<number | null>(null);
  // Celular (< 768 px): las propiedades van en un cajón inferior que se abre al seleccionar algo.
  const [movil, setMovil] = useState(false);
  const [cajon, setCajon] = useState(false);
  const [guias, setGuias] = useState<Guias>({ v: [], h: [] });
  const [marquesina, setMarquesina] = useState<Caja | null>(null);
  const [respectoHoja, setRespectoHoja] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [, redibujar] = useState(0);

  const lienzo = useRef<HTMLDivElement>(null);

  /* Referencias a lo último, para los manejadores globales (arrastres, teclado). */
  const paginaRef = useRef(pagina);
  paginaRef.current = pagina;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const selRef = useRef(sel);
  selRef.current = sel;
  const getEls = () => paginaRef.current.elementos ?? [];
  const setEls = (next: Elemento[]) => {
    paginaRef.current = { ...paginaRef.current, elementos: next };
    onChangeRef.current(paginaRef.current);
  };

  // Con varios elementos seleccionados, los bloqueados (elegidos desde la lista de capas) no participan: no se mueven, redimensionan ni giran.
  const seleccionTodos = elementos.filter((e) => sel.includes(e.id!));
  const seleccion = seleccionTodos.length > 1 ? seleccionTodos.filter((e) => !e.bloqueado) : seleccionTodos;
  const unico = seleccion.length === 1 ? seleccion[0] : null;

  /* ---------------------------- Historial ---------------------------- */

  const pasado = useRef<Elemento[][]>([]);
  const futuro = useRef<Elemento[][]>([]);
  const ultimo = useRef<{ clave: string; t: number } | null>(null);

  const guardarHistorial = () => {
    pasado.current.push(getEls());
    if (pasado.current.length > 150) pasado.current.shift();
    futuro.current = [];
    ultimo.current = null;
  };

  /** Aplica un cambio. Ediciones seguidas con la misma `clave` forman un solo paso de deshacer. */
  const aplicar = (next: Elemento[], clave?: string) => {
    const ahora = Date.now();
    if (!(clave && ultimo.current?.clave === clave && ahora - ultimo.current.t < 900)) guardarHistorial();
    ultimo.current = clave ? { clave, t: ahora } : null;
    setEls(next);
  };

  const deshacer = () => {
    const prev = pasado.current.pop();
    if (!prev) return;
    futuro.current.push(getEls());
    ultimo.current = null;
    setEls(prev);
    // Quita de la selección lo que dejó de existir.
    setSel((s) => s.filter((id) => prev.some((e) => e.id === id)));
    redibujar((n) => n + 1);
  };
  const rehacer = () => {
    const sig = futuro.current.pop();
    if (!sig) return;
    pasado.current.push(getEls());
    ultimo.current = null;
    setEls(sig);
    setSel((s) => s.filter((id) => sig.some((e) => e.id === id)));
    redibujar((n) => n + 1);
  };

  /* Ids para elementos escritos a mano. */
  useEffect(() => {
    if (getEls().some((e) => !e.id)) setEls(getEls().map((e) => (e.id ? e : { ...e, id: nuevoId() })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------ Vista -------------------------------- */
  // La hoja se dibuja a `s` píxeles por unidad y se desplaza (x, y) dentro del área de trabajo.

  const [vista, setVista] = useState<{ s: number; x: number; y: number; modo: "ancho" | "pagina" | "libre" }>({
    s: 0.8,
    x: MARGEN_VISTA,
    y: MARGEN_VISTA,
    modo: ajusteRecordado,
  });
  const [mano, setMano] = useState(false);
  /** Resalta sobre la hoja los textos y fotos que siguen siendo de ejemplo (solo en el editor). */
  const [verEjemplos, setVerEjemplos] = useState(true);
  const { abrir: abrirMenu, menu: menuContextual } = useMenuContextual();
  const [espacio, setEspacio] = useState(false);
  const [arrastrandoVista, setArrastrandoVista] = useState(false);
  const [completa, setCompleta] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const vistaRef = useRef(vista);
  const areaRef = useRef({ w: 800, h: 600 });
  const altoRef = useRef(alto);
  altoRef.current = alto;
  const espacioRef = useRef(false);
  const anchoPx = ANCHO_LIENZO * vista.s;

  const fijarVista = (v: typeof vista) => {
    if (v.modo !== "libre") ajusteRecordado = v.modo;
    vistaRef.current = v;
    setVista(v);
  };
  const limitarZoom = (s: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s));

  /** Zoom y posición para que la hoja quepa a lo ancho o entera. */
  function ajuste(modo: "ancho" | "pagina", a = areaRef.current) {
    const h = altoRef.current;
    const sAncho = (a.w - 2 * MARGEN_VISTA) / ANCHO_LIENZO;
    const sAlto = (a.h - 2 * MARGEN_VISTA) / h;
    const s = limitarZoom(modo === "pagina" ? Math.min(sAncho, sAlto) : sAncho);
    return {
      s,
      x: (a.w - ANCHO_LIENZO * s) / 2,
      y: modo === "pagina" ? Math.max(MARGEN_VISTA / 2, (a.h - h * s) / 2) : MARGEN_VISTA,
      modo,
    };
  }

  /** Impide perder la hoja de vista: siempre queda al menos una franja visible. */
  function acotar(x: number, y: number, s: number) {
    const a = areaRef.current;
    const franja = 80;
    return {
      x: Math.min(a.w - franja, Math.max(franja - ANCHO_LIENZO * s, x)),
      y: Math.min(a.h - franja, Math.max(franja - altoRef.current * s, y)),
    };
  }

  /** Cambia el zoom manteniendo fijo el punto (cx, cy) del área de trabajo. */
  function zoomEn(sNuevo: number, cx: number, cy: number) {
    const v = vistaRef.current;
    const s = limitarZoom(sNuevo);
    const k = s / v.s;
    fijarVista({ s, ...acotar(cx - (cx - v.x) * k, cy - (cy - v.y) * k, s), modo: "libre" });
  }
  const zoomCentro = (s: number) => zoomEn(s, areaRef.current.w / 2, areaRef.current.h / 2);
  const ajustarVista = (modo: "ancho" | "pagina") => fijarVista(ajuste(modo));

  // Tamaño del área de trabajo: si la vista está en modo "ajustar", se reajusta sola.
  useEffect(() => {
    const nodo = viewport.current;
    if (!nodo) return;
    const medir = () => {
      areaRef.current = { w: nodo.clientWidth, h: nodo.clientHeight };
      const v = vistaRef.current;
      if (v.modo !== "libre") fijarVista(ajuste(v.modo));
      else fijarVista({ ...v, ...acotar(v.x, v.y, v.s) });
    };
    // En celular la hoja entera quedaría diminuta: se abre ajustada al ancho (con «Entera» se ve completa).
    if (window.matchMedia("(max-width: 767px)").matches && vistaRef.current.modo === "pagina") vistaRef.current = { ...vistaRef.current, modo: "ancho" };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(nodo);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cambia el alto de la hoja y la vista está en modo "ajustar", se reajusta.
  useEffect(() => {
    if (vistaRef.current.modo !== "libre") fijarVista(ajuste(vistaRef.current.modo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alto]);

  // Rueda: Ctrl/⌘ + rueda (o pellizco) hace zoom hacia el cursor; sin Ctrl desplaza la hoja.
  useEffect(() => {
    const nodo = viewport.current;
    if (!nodo) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const r = nodo.getBoundingClientRect();
      const k = ev.deltaMode === 1 ? 33 : ev.deltaMode === 2 ? r.height : 1;
      const dx = ev.deltaX * k;
      const dy = ev.deltaY * k;
      const v = vistaRef.current;
      if (ev.ctrlKey || ev.metaKey) {
        zoomEn(v.s * Math.exp(-dy * 0.0025), ev.clientX - r.left, ev.clientY - r.top);
      } else {
        const p = acotar(v.x - (ev.shiftKey ? dy : dx), v.y - (ev.shiftKey ? 0 : dy), v.s);
        fijarVista({ ...v, ...p, modo: "libre" });
      }
    };
    nodo.addEventListener("wheel", onWheel, { passive: false });
    return () => nodo.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pantalla táctil: con dos dedos se hace zoom (pellizco) y se desplaza la hoja. Mientras dura el gesto, se cancela lo que hiciera un
  // solo dedo (mover o redimensionar un elemento) para no deformar nada por accidente.
  useEffect(() => {
    const nodo = viewport.current;
    if (!nodo) return;
    const dedos = new Map<number, { x: number; y: number }>();
    let gesto: null | { d0: number; cx0: number; cy0: number; v0: typeof vistaRef.current } = null;
    const medir = () => {
      const [a, b] = [...dedos.values()];
      const r = nodo.getBoundingClientRect();
      return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2 - r.left, cy: (a.y + b.y) / 2 - r.top };
    };
    const abajo = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch" || !(ev.target instanceof Node) || !nodo.contains(ev.target)) return;
      dedos.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (dedos.size === 2) {
        const m = medir();
        gesto = { d0: m.d, cx0: m.cx, cy0: m.cy, v0: vistaRef.current };
      }
    };
    const mover = (ev: PointerEvent) => {
      if (ev.pointerType !== "touch" || !dedos.has(ev.pointerId)) return;
      dedos.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (!gesto || dedos.size < 2) return;
      ev.stopImmediatePropagation(); // los arrastres de un dedo no deben seguir durante el pellizco
      const m = medir();
      const s = limitarZoom(gesto.v0.s * (m.d / gesto.d0));
      const k = s / gesto.v0.s;
      // El punto bajo el centro inicial de los dedos sigue al centro actual (zoom + desplazamiento).
      fijarVista({ s, ...acotar(m.cx - (gesto.cx0 - gesto.v0.x) * k, m.cy - (gesto.cy0 - gesto.v0.y) * k, s), modo: "libre" });
    };
    const arriba = (ev: PointerEvent) => {
      if (!dedos.delete(ev.pointerId)) return;
      if (dedos.size < 2) gesto = null;
    };
    window.addEventListener("pointerdown", abajo, true); // en window: el manejador del fondo detiene el evento antes de llegar a la hoja
    window.addEventListener("pointermove", mover, true);
    window.addEventListener("pointerup", arriba, true);
    window.addEventListener("pointercancel", arriba, true);
    return () => {
      window.removeEventListener("pointerdown", abajo, true);
      window.removeEventListener("pointermove", mover, true);
      window.removeEventListener("pointerup", arriba, true);
      window.removeEventListener("pointercancel", arriba, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantener Espacio = herramienta Mano temporal.
  useEffect(() => {
    const abajo = (ev: KeyboardEvent) => {
      if (ev.code !== "Space") return;
      const t = ev.target;
      if (t instanceof Element && t.closest("input,textarea,select,[contenteditable]")) return;
      if (acc.current.editando) return;
      ev.preventDefault();
      if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
      if (!espacioRef.current) {
        espacioRef.current = true;
        setEspacio(true);
      }
    };
    const arriba = (ev: KeyboardEvent) => {
      if (ev.code !== "Space") return;
      espacioRef.current = false;
      setEspacio(false);
    };
    window.addEventListener("keydown", abajo);
    window.addEventListener("keyup", arriba);
    return () => {
      window.removeEventListener("keydown", abajo);
      window.removeEventListener("keyup", arriba);
    };
  }, []);

  /** Desplazar la hoja arrastrando: con la Mano, con Espacio, con el botón central o desde el fondo gris. */
  function alPunteroVista(e: React.PointerEvent) {
    const conMano = e.button === 1 || (e.button === 0 && (mano || espacioRef.current));
    const enFondo = e.button === 0 && e.target === e.currentTarget;
    if (!conMano && !enFondo) return;
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const v0 = vistaRef.current;
    let movido = false;
    setArrastrandoVista(true);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (!movido && Math.hypot(dx, dy) < 3) return;
      movido = true;
      fijarVista({ ...v0, ...acotar(v0.x + dx, v0.y + dy, v0.s), modo: "libre" });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setArrastrandoVista(false);
      if (!movido && enFondo) {
        setSel([]);
        setEditando(null);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const escala = () => (lienzo.current?.getBoundingClientRect().width ?? anchoPx) / ANCHO_LIENZO;

  /* ---------------------------- Acciones ----------------------------- */

  /** Edita las propiedades del elemento seleccionado (solo con un elemento seleccionado). */
  const cambiar = (patch: Partial<Elemento>, clave?: string) => {
    if (!unico) return;
    const id = unico.id;
    aplicar(
      getEls().map((e) => (e.id === id ? ({ ...e, ...patch } as Elemento) : e)),
      clave ? `${id}:${clave}` : undefined,
    );
  };

  const agregar = (preset: PresetElemento, cx?: number, cy?: number) => {
    const el = elementoNuevo(preset, cx, cy);
    aplicar([...getEls(), el]);
    setSel([el.id!]);
    return el;
  };

  const agregarIcono = (id: string, cx?: number, cy?: number) => {
    const el = elementoIcono(id, cx, cy);
    aplicar([...getEls(), el]);
    setSel([el.id!]);
  };

  /* ------------------------------ Mis elementos ------------------------------ */

  const [mios, setMios] = useState<ElementoGuardado[] | null>(null);
  const modoPanel = biblioteca?.modo;
  useEffect(() => {
    if (modoPanel !== "mios" || mios !== null) return;
    fetch("/api/admin/elementos")
      .then((r) => r.json())
      .then((j) => setMios(Array.isArray(j.elementos) ? j.elementos : []))
      .catch(() => setMios([]));
  }, [modoPanel, mios]);

  const guardarSeleccion = async () => {
    if (seleccion.length === 0) {
      avisar("Selecciona primero lo que quieres guardar.");
      return;
    }
    const nombre = window.prompt("Nombre para guardar estos elementos:", "");
    if (!nombre?.trim()) return;
    try {
      const res = await fetch("/api/admin/elementos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, elementos: seleccion }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Error ${res.status}`);
      setMios((l) => [j.elemento as ElementoGuardado, ...(l ?? [])]);
      setBiblioteca({ modo: "mios" });
      avisar("Guardado en Mis elementos");
    } catch (e) {
      avisar(mensajeSimple(e, "No se pudo guardar"));
    }
  };

  const renombrarMio = async (id: string) => {
    const actual = mios?.find((m) => m.id === id);
    const nombre = window.prompt("Nuevo nombre:", actual?.nombre ?? "");
    if (!nombre?.trim() || nombre.trim() === actual?.nombre) return;
    try {
      const res = await fetch(`/api/admin/elementos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Error ${res.status}`);
      setMios((l) => (l ?? []).map((m) => (m.id === id ? { ...m, nombre: nombre.trim().replace(/\s+/g, " ") } : m)));
    } catch (e) {
      avisar(mensajeSimple(e, "No se pudo renombrar"));
    }
  };

  const borrarMio = async (id: string) => {
    const actual = mios?.find((m) => m.id === id);
    if (!window.confirm(`¿Borrar «${actual?.nombre ?? id}» de Mis elementos? Las ediciones donde ya lo usaste no cambian.`)) return;
    try {
      const res = await fetch(`/api/admin/elementos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
      setMios((l) => (l ?? []).filter((m) => m.id !== id));
    } catch (e) {
      avisar(mensajeSimple(e, "No se pudo borrar"));
    }
  };

  /** Agrega un grupo guardado, centrado donde se pida (por defecto en medio de la hoja), todo junto en un grupo nuevo. */
  const agregarMio = (id: string, cx = ANCHO_LIENZO / 2, cy = 500) => {
    const item = mios?.find((m) => m.id === id);
    if (!item) return;
    const x0 = Math.round(Math.min(Math.max(0, cx - item.w / 2), Math.max(0, ANCHO_LIENZO - item.w)));
    const y0 = Math.max(0, Math.round(cy - item.h / 2));
    const grupo = item.elementos.length > 1 ? nuevoId() : undefined;
    const els = item.elementos.map((e) => {
      const { grupo: _g, ...resto } = e;
      void _g;
      return { ...structuredClone(resto), x: e.x + x0, y: e.y + y0, id: nuevoId(), ...(grupo ? { grupo } : {}) } as Elemento;
    });
    aplicar([...getEls(), ...els]);
    setSel(els.map((e) => e.id!));
  };

  const agregarBloque = (id: string, cx?: number, cy?: number) => {
    const els = elementosBloque(id, cx, cy);
    aplicar([...getEls(), ...els]);
    setSel(els.map((e) => e.id!));
  };

  const agregarBoton = (id: string, cx?: number, cy?: number) => {
    const el = elementoBoton(id, cx, cy);
    aplicar([...getEls(), el]);
    setSel([el.id!]);
  };

  const agregarLogo = (id: LogoId, cx?: number, cy?: number) => {
    const el = elementoLogo(id, cx, cy);
    aplicar([...getEls(), el]);
    setSel([el.id!]);
  };

  /** Elemento (de los tipos dados) bajo un punto de la hoja; el de más arriba. */
  const elementoEn = (x: number, y: number, tipos: Elemento["tipo"][]) =>
    [...getEls()].reverse().find((e) => {
      const c = caja(e);
      return tipos.includes(e.tipo) && x >= c.l && x <= c.r && y >= c.t && y <= c.b;
    });

  const aplicarMoldeA = (id: string, molde: MoldeId | undefined) =>
    aplicar(getEls().map((e) => (e.id === id ? ({ ...e, molde, radio: undefined } as Elemento) : e)));

  /** Aplica un molde a la selección (foto, video o forma) o, sin selección, crea un marco o una forma. */
  const aplicarMolde = (molde: MoldeId, comoForma: boolean, cx?: number, cy?: number) => {
    if (unico && (unico.tipo === "imagen" || unico.tipo === "video" || unico.tipo === "forma")) {
      aplicarMoldeA(unico.id!, molde);
      return;
    }
    const el = comoForma ? elementoFormaMolde(molde, cx, cy) : elementoMarco(molde, cx, cy);
    aplicar([...getEls(), el]);
    setSel([el.id!]);
  };

  const eliminar = () => {
    const ids = selRef.current;
    if (ids.length === 0) return;
    const lista = getEls();
    const bloqueados = lista.filter((e) => ids.includes(e.id!) && e.bloqueado).map((e) => e.id!);
    const borrar = ids.filter((id) => !bloqueados.includes(id));
    if (bloqueados.length) avisar(bloqueados.length === 1 ? "Un elemento está bloqueado: desbloquéalo para borrarlo." : `${bloqueados.length} elementos están bloqueados: desbloquéalos para borrarlos.`);
    if (borrar.length === 0) return;
    aplicar(lista.filter((e) => !borrar.includes(e.id!)));
    setSel(bloqueados);
    setEditando(null);
  };

  /** Bloquea (o desbloquea) la selección: si todo está bloqueado se desbloquea; si no, se bloquea todo. Al bloquear se quita la selección. */
  const alternarBloqueoSeleccion = () => {
    const ids = selRef.current;
    const elegidos = getEls().filter((e) => ids.includes(e.id!));
    if (elegidos.length === 0) return;
    const bloquear = !elegidos.every((e) => e.bloqueado);
    aplicar(getEls().map((e) => (ids.includes(e.id!) ? ({ ...e, bloqueado: bloquear ? true : undefined } as Elemento) : e)));
    if (bloquear) {
      setSel([]);
      avisar(elegidos.length === 1 ? "Elemento bloqueado (se desbloquea en la lista de capas)" : `${elegidos.length} elementos bloqueados (se desbloquean en la lista de capas)`);
    }
  };

  /** Candado y ojo de una capa en la lista. */
  const alternarCapa = (id: string, campo: "bloqueado" | "oculto") =>
    aplicar(getEls().map((e) => (e.id === id ? ({ ...e, [campo]: e[campo] ? undefined : true } as Elemento) : e)));

  /** Añade a `ids` todos los miembros de los grupos a los que pertenecen. */
  const expandir = (ids: string[]) => {
    const lista = getEls();
    const grupos = new Set(lista.filter((e) => ids.includes(e.id!) && e.grupo).map((e) => e.grupo));
    return lista.filter((e) => ids.includes(e.id!) || (e.grupo && grupos.has(e.grupo))).map((e) => e.id!);
  };

  const duplicar = () => {
    const ids = selRef.current;
    const originales = getEls().filter((e) => ids.includes(e.id!));
    if (originales.length === 0) return;
    // Las copias de un grupo forman un grupo nuevo, separado del original.
    const grupoNuevo = new Map<string, string>();
    const copias = originales.map((el) => {
      const copia = { ...structuredClone(el), id: nuevoId(), x: el.x + 20, y: el.y + 20 } as Elemento;
      if (el.grupo) {
        if (!grupoNuevo.has(el.grupo)) grupoNuevo.set(el.grupo, nuevoId());
        copia.grupo = grupoNuevo.get(el.grupo);
      }
      return copia;
    });
    aplicar([...getEls(), ...copias]);
    setSel(copias.map((c) => c.id!));
  };

  const agrupar = () => {
    const ids = selRef.current;
    if (ids.length < 2) return;
    const g = nuevoId();
    aplicar(getEls().map((e) => (ids.includes(e.id!) ? { ...e, grupo: g } : e)));
  };

  const desagrupar = () => {
    const ids = selRef.current;
    aplicar(
      getEls().map((e) => {
        if (!ids.includes(e.id!) || !e.grupo) return e;
        const { grupo, ...resto } = e;
        void grupo;
        return resto as Elemento;
      }),
    );
  };

  /* ---------------------------- Animaciones --------------------------- */

  /** Vista previa en la hoja: anima el contenido de los elementos indicados (o de todos los que tengan animación). */
  const reproducir = (ids?: string[]) => {
    const raiz = lienzo.current;
    if (!raiz) return;
    for (const el of getEls()) {
      if (!(el.animacion || el.salida) || (ids && !ids.includes(el.id!))) continue;
      const caja = raiz.querySelector<HTMLElement>(`[data-elid="${el.id}"]`);
      const nodo = caja?.firstElementChild;
      const salida = el.salida;
      // Salida: se ve la entrada (si la tiene), una pausa corta (como mucho 2 s) y la salida; después el elemento vuelve a mostrarse.
      const programarSalida = (esperaEntrada: number) => {
        if (!salida || !(nodo instanceof HTMLElement) || typeof nodo.animate !== "function") return;
        window.setTimeout(() => {
          const a = nodo.animate(fotogramasSalida(salida.efecto), opcionesSalida(salida));
          a.finished.then(() => window.setTimeout(() => a.cancel(), 700)).catch(() => {});
        }, esperaEntrada + Math.min(2000, salida.despues ?? DESPUES_DEFECTO));
      };
      if (!el.animacion) {
        programarSalida(0);
        continue;
      }
      if (caja && nodo instanceof HTMLElement && el.tipo === "texto" && animarTexto(nodo, caja, el.animacion)) {
        programarSalida((el.animacion.retraso ?? 0) + (el.animacion.duracion ?? 1500));
        continue;
      }
      if (nodo instanceof HTMLElement && typeof nodo.animate === "function") {
        nodo.animate(fotogramas(el.animacion.efecto), opcionesAnimacion(el.animacion));
        programarSalida((el.animacion.retraso ?? 0) + (el.animacion.duracion ?? 700));
      }
    }
  };

  /** Pruebas de movimiento en curso por elemento: al lanzar otra se cancela la anterior. */
  const pruebasMov = useRef(new Map<string, Animation[]>());

  /** Vista previa en la hoja del movimiento continuo y del efecto al pasar el cursor del elemento (`forzar` = el valor que se acaba de elegir). */
  const probarMovimiento = (id: string, forzar?: { hover?: Hover; bucle?: Bucle }) => {
    const raiz = lienzo.current;
    const el = getEls().find((e) => e.id === id);
    const nodo = raiz?.querySelector<HTMLElement>(`[data-elid="${id}"]`)?.firstElementChild;
    if (!el || !(nodo instanceof HTMLElement) || typeof nodo.animate !== "function") return;
    pruebasMov.current.get(id)?.forEach((a) => a.cancel());
    const bucle = forzar?.bucle ?? (forzar ? undefined : el.bucle);
    const hover = forzar?.hover ?? (forzar ? undefined : el.hover);
    const lista: Animation[] = [];
    if (bucle) {
      const p = pruebaBucle(bucle);
      lista.push(nodo.animate(p.fotogramas, p.opciones));
    }
    if (hover) {
      const p = pruebaHover(hover);
      // Si hay movimiento continuo a la vez, se suma a él en lugar de pisarlo.
      const objetivo = hover === "acercar" && (el.tipo === "imagen" || el.tipo === "video") ? (nodo.querySelector<HTMLElement>("img, video") ?? nodo) : nodo;
      const fot = objetivo === nodo ? p.fotogramas : p.fotogramas.map((f) => (f.transform && f.transform !== "none" ? { ...f, transform: "scale(1.1)" } : f));
      lista.push(objetivo.animate(fot, { duration: 1600, easing: "ease-in-out", composite: bucle ? "add" : "replace" }));
    }
    pruebasMov.current.set(id, lista);
  };

  /** Mismo efecto para toda la selección, de arriba abajo (y de izquierda a derecha), con pausa creciente. */
  const animarCascada = (efecto: Efecto, paso: number) => {
    const ids = selRef.current;
    const orden = getEls().filter((e) => ids.includes(e.id!)).sort((a, b) => a.y - b.y || a.x - b.x);
    const retraso = new Map(orden.map((e, i) => [e.id!, i * paso]));
    aplicar(
      getEls().map((e) =>
        retraso.has(e.id!)
          ? ({ ...e, animacion: { efecto, duracion: e.animacion?.duracion, retraso: retraso.get(e.id!) || undefined } } as Elemento)
          : e,
      ),
    );
    window.setTimeout(() => reproducir(ids), 50);
  };

  /* ------------------------- Copiar y pegar ------------------------- */

  const avisar = (texto: string) => {
    setAviso(texto);
    window.setTimeout(() => setAviso((a) => (a === texto ? null : a)), 2500);
  };

  const copiar = (): Carga | null => {
    const ids = selRef.current;
    const els = getEls().filter((e) => ids.includes(e.id!)).map((e) => structuredClone(e));
    if (els.length === 0) return null;
    const carga = aCarga(edicionId, els);
    guardarInterno(carga);
    avisar(els.length === 1 ? "1 elemento copiado" : `${els.length} elementos copiados`);
    return carga;
  };

  /* --------------------------- Copiar y pegar estilo --------------------------- */

  /** Estilo copiado con la brocha; se recuerda en este navegador para usarlo también en otras páginas y ediciones. */
  const [estiloCopiado, setEstiloCopiado] = useState<EstiloCopiado | null>(null);
  const estiloRef = useRef<EstiloCopiado | null>(null);
  estiloRef.current = estiloCopiado;
  useEffect(() => {
    try {
      const crudo = localStorage.getItem("revista:estilo");
      if (crudo) {
        const e = JSON.parse(crudo) as EstiloCopiado;
        if (e && typeof e.tipo === "string" && e.valores && typeof e.valores === "object") setEstiloCopiado(e);
      }
    } catch {
      // sin localStorage: el estilo copiado dura mientras el editor esté abierto
    }
  }, []);

  const copiarEstiloSel = () => {
    const ids = selRef.current;
    const el = ids.length === 1 ? getEls().find((e) => e.id === ids[0]) : undefined;
    if (!el) {
      avisar("Selecciona un solo elemento para copiar su estilo");
      return;
    }
    const estilo = copiarEstilo(el);
    setEstiloCopiado(estilo);
    try {
      localStorage.setItem("revista:estilo", JSON.stringify(estilo));
    } catch {}
    const n = Object.keys(estilo.valores).length;
    avisar(n ? `Estilo copiado (${n} ajuste${n === 1 ? "" : "s"}): pégalo en otros elementos` : "Estilo copiado: este elemento no tiene ajustes (al pegarlo quita los de los demás)");
  };

  const pegarEstiloSel = () => {
    const estilo = estiloRef.current;
    const ids = selRef.current;
    if (!estilo) {
      avisar("Primero copia el estilo de un elemento");
      return;
    }
    if (ids.length === 0) {
      avisar("Selecciona los elementos a los que aplicar el estilo");
      return;
    }
    let cambiados = 0;
    aplicar(
      getEls().map((e) => {
        if (!ids.includes(e.id!) || e.bloqueado) return e;
        const r = aplicarEstilo(e, estilo);
        if (r.cambios > 0) cambiados++;
        return r.elemento;
      }),
    );
    avisar(cambiados ? `Estilo aplicado a ${cambiados} elemento${cambiados === 1 ? "" : "s"}` : "Nada que cambiar: ya tienen ese estilo o son de otro tipo");
  };

  const cortar = (): Carga | null => {
    const carga = copiar();
    if (carga) eliminar();
    return carga;
  };

  /**
   * Pega elementos con ids nuevos. Si en la página ya hay copias en el mismo sitio se desplazan 20 en 20 para que no
   * queden encimadas; con `mismoLugar` (Ctrl+Mayús+V) se pegan exactamente donde estaban. Los grupos se renuevan, y al pegar
   * en otra edición se quitan los enlaces a números de página, que allí no significarían lo mismo.
   */
  const pegar = (carga: Carga, mismoLugar = false) => {
    const existentes = getEls();
    let d = 0;
    if (!mismoLugar) {
      const choca = (dd: number) =>
        carga.elementos.some((e) =>
          existentes.some((o) => o.tipo === e.tipo && o.x === e.x + dd && o.y === e.y + dd && o.w === e.w && o.h === e.h),
        );
      while (d < 400 && choca(d)) d += 20;
    }
    const grupos = new Map<string, string>();
    const nuevos = carga.elementos.map((e) => {
      const n = { ...structuredClone(e), id: nuevoId(), x: Math.round(e.x + d), y: Math.round(e.y + d) } as Elemento;
      if (e.grupo) {
        if (!grupos.has(e.grupo)) grupos.set(e.grupo, nuevoId());
        n.grupo = grupos.get(e.grupo);
      }
      if (carga.edicion !== edicionId && typeof n.enlace === "number") delete n.enlace;
      return n;
    });
    aplicar([...existentes, ...nuevos]);
    setSel(nuevos.map((n) => n.id!));
    avisar(nuevos.length === 1 ? "1 elemento pegado" : `${nuevos.length} elementos pegados`);
  };

  /** Texto suelto del portapapeles (no copiado desde la revista): se convierte en un cuadro de texto. */
  const pegarTexto = (texto: string) => {
    const el = { ...elementoNuevo("parrafo"), texto: texto.slice(0, 5000).replace(/\r\n/g, "\n") } as Elemento;
    aplicar([...getEls(), el]);
    setSel([el.id!]);
  };

  /** Pegar desde un evento "paste": elementos de la revista, una imagen o texto. Devuelve si hizo algo. */
  const pegarDesdeEvento = (cd: DataTransfer, mismoLugar: boolean) => {
    // Todo se lee antes de cualquier espera: el portapapeles del evento solo es válido mientras dura.
    const texto = cd.getData("text/plain");
    const imagen = Array.from(cd.files).find((f) => f.type.startsWith("image/"));
    const carga = desdeTexto(texto);
    if (carga) {
      pegar(carga, mismoLugar);
      return true;
    }
    // Trae la marca de la revista pero su contenido no es válido: se ignora en lugar de pegarlo como texto.
    if (pareceDeLaRevista(texto)) {
      avisar("Lo copiado no es válido y no se pegó.");
      return true;
    }
    if (imagen) {
      void incorporarArchivo(imagen, ANCHO_LIENZO / 2, 300);
      return true;
    }
    if (texto.trim()) {
      pegarTexto(texto);
      return true;
    }
    return false;
  };

  /** Botones: usan el portapapeles del sistema y, si el navegador no lo permite, la copia interna. */
  const copiarBoton = () => {
    const c = copiar();
    if (c) navigator.clipboard?.writeText(JSON.stringify(c)).catch(() => {});
  };
  const cortarBoton = () => {
    const c = cortar();
    if (c) navigator.clipboard?.writeText(JSON.stringify(c)).catch(() => {});
  };
  const pegarBoton = async () => {
    try {
      const c = desdeTexto(await navigator.clipboard.readText());
      if (c) return pegar(c);
    } catch {
      // sin permiso para leer el portapapeles: se usa la copia interna
    }
    const interna = leerInterno();
    if (interna) pegar(interna);
    else avisar("No hay nada que pegar: copia primero algunos elementos.");
  };

  /** Capas: el grupo seleccionado al frente / al fondo, conservando su orden relativo. */
  const moverGrupo = (a: "frente" | "atras") => {
    const ids = selRef.current;
    const lista = getEls();
    const grupo = lista.filter((e) => ids.includes(e.id!));
    const resto = lista.filter((e) => !ids.includes(e.id!));
    aplicar(a === "frente" ? [...resto, ...grupo] : [...grupo, ...resto]);
  };

  /** Una capa arriba/abajo (desde la lista de capas). */
  const moverCapa = (a: "subir" | "bajar", id: string) => {
    const lista = getEls();
    const i = lista.findIndex((e) => e.id === id);
    if (i < 0) return;
    const j = a === "subir" ? Math.min(lista.length - 1, i + 1) : Math.max(0, i - 1);
    if (i === j) return;
    const copia = [...lista];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    aplicar(copia);
  };

  function ajustarAltoTexto() {
    if (!unico || unico.tipo !== "texto" || !lienzo.current) return;
    const nodo = lienzo.current.querySelector<HTMLElement>(`[data-elid="${unico.id}"] [data-texto]`);
    if (!nodo) return;
    cambiar({ h: Math.max(10, Math.ceil(nodo.offsetHeight / escala() + 2 * (unico.relleno ?? 0))) });
  }

  /* ----------------------------- Alinear ------------------------------ */

  function alinear(tipo: Alineacion6) {
    const els = getEls().filter((e) => selRef.current.includes(e.id!));
    if (els.length === 0) return;
    const ref: Caja =
      els.length > 1 && !respectoHoja ? unir(els.map(caja)) : { l: 0, t: 0, r: ANCHO_LIENZO, b: alto };
    aplicar(
      getEls().map((e) => {
        if (!selRef.current.includes(e.id!)) return e;
        const c = caja(e);
        let dx = 0;
        let dy = 0;
        if (tipo === "izq") dx = ref.l - c.l;
        else if (tipo === "cen") dx = (ref.l + ref.r) / 2 - (c.l + c.r) / 2;
        else if (tipo === "der") dx = ref.r - c.r;
        else if (tipo === "sup") dy = ref.t - c.t;
        else if (tipo === "med") dy = (ref.t + ref.b) / 2 - (c.t + c.b) / 2;
        else dy = ref.b - c.b;
        return { ...e, x: Math.round(e.x + dx), y: Math.round(e.y + dy) };
      }),
    );
  }

  /** Reparte los elementos con el mismo hueco entre ellos; el primero y el último no se mueven. */
  function distribuir(eje: "h" | "v") {
    const els = getEls().filter((e) => selRef.current.includes(e.id!));
    if (els.length < 3) return;
    const ini = eje === "h" ? "l" : "t";
    const fin = eje === "h" ? "r" : "b";
    const orden = [...els].sort((a, b) => caja(a)[ini] - caja(b)[ini]);
    const cajas = orden.map(caja);
    const total = cajas[cajas.length - 1][fin] - cajas[0][ini];
    const ocupado = cajas.reduce((s, c) => s + (c[fin] - c[ini]), 0);
    const hueco = (total - ocupado) / (orden.length - 1);
    const delta = new Map<string, number>();
    let pos = cajas[0][ini];
    orden.forEach((e, i) => {
      delta.set(e.id!, pos - cajas[i][ini]);
      pos += cajas[i][fin] - cajas[i][ini] + hueco;
    });
    aplicar(
      getEls().map((e) => {
        const d = delta.get(e.id!);
        if (d === undefined) return e;
        return eje === "h" ? { ...e, x: Math.round(e.x + d) } : { ...e, y: Math.round(e.y + d) };
      }),
    );
  }

  /* ----------------------- Interacción con el ratón ------------------- */

  /** Imanes: acerca un rectángulo a los bordes y centros de la hoja y de los demás elementos. */
  function ajustar(c: { x: number; y: number; w: number; h: number }, excluir: string[]) {
    const umbral = UMBRAL_PX / escala();
    const xs = [0, ANCHO_LIENZO / 2, ANCHO_LIENZO, ...(paginaRef.current.guias?.v ?? [])];
    const ys = [0, alto / 2, alto, ...(paginaRef.current.guias?.h ?? [])];
    for (const o of getEls()) {
      if (excluir.includes(o.id!) || o.rot) continue;
      xs.push(o.x, o.x + o.w / 2, o.x + o.w);
      ys.push(o.y, o.y + o.h / 2, o.y + o.h);
    }
    const mejor = (pos: number, largo: number, objetivos: number[]) => {
      let best: { d: number; ajuste: number; guia: number } | null = null;
      for (const p of [pos, pos + largo / 2, pos + largo]) {
        for (const t of objetivos) {
          const d = Math.abs(p - t);
          if (d <= umbral && (!best || d < best.d)) best = { d, ajuste: t - p, guia: t };
        }
      }
      return best;
    };
    const bx = mejor(c.x, c.w, xs);
    const by = mejor(c.y, c.h, ys);
    // Sin nada cerca, y con el imán de la cuadrícula activo, la esquina superior izquierda va a la cuadrícula.
    const paso = rejRef.current.iman ? rejRef.current.paso : 0;
    return {
      x: c.x + (bx ? bx.ajuste : paso ? Math.round(c.x / paso) * paso - c.x : 0),
      y: c.y + (by ? by.ajuste : paso ? Math.round(c.y / paso) * paso - c.y : 0),
      v: bx ? [bx.guia] : [],
      h: by ? [by.guia] : [],
    };
  }

  /** Encuadre con el ratón: la foto sigue al puntero dentro de su marco (cambia el enfoque). */
  function empezarRecorte(e: React.PointerEvent, el: Elemento) {
    if (e.button !== 0 || el.tipo !== "imagen") return;
    e.stopPropagation();
    const img = lienzo.current?.querySelector<HTMLImageElement>(`[data-elid="${el.id}"] img`);
    if (!img || !img.naturalWidth) return;
    const natural = { w: img.naturalWidth, h: img.naturalHeight };
    const s = escala();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const base = el.enfoque ?? { x: 50, y: 50 };
    let guardado = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - x0) / s;
      const dy = (ev.clientY - y0) / s;
      if (!guardado) {
        if (Math.hypot(dx, dy) * s < 2) return;
        guardarHistorial();
        guardado = true;
      }
      const enfoque = desplazarEnfoque({ w: el.w, h: el.h }, natural, el.zoom ?? 1, el.ajuste ?? "cubrir", base, dx, dy);
      setEls(getEls().map((it) => (it.id === el.id ? ({ ...it, enfoque } as Elemento) : it)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function empezarMover(e: React.PointerEvent, el: Elemento) {
    if (e.button !== 0) return;
    e.stopPropagation();
    // Dentro de un texto en edición, el clic solo coloca el cursor.
    if (editando === el.id) return;
    if (editando) setEditando(null);

    // Mayús / Ctrl: agrega o quita de la selección (con su grupo, si lo tiene), sin mover.
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const miembros = expandir([el.id!]);
      setSel((s) => (s.includes(el.id!) ? s.filter((id) => !miembros.includes(id)) : [...new Set([...s, ...miembros])]));
      return;
    }

    // Si ya forma parte de la selección se mueve toda; si no, se selecciona este (y su grupo).
    let ids = selRef.current;
    if (!ids.includes(el.id!)) {
      ids = expandir([el.id!]);
      setSel(ids);
    }
    const s = escala();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const grupo = getEls().filter((it) => ids.includes(it.id!) && !it.bloqueado);
    if (grupo.length === 0) return;
    const inicio = new Map(grupo.map((it) => [it.id!, { x: it.x, y: it.y }]));
    const base = unir(grupo.map(caja));
    const conGiro = grupo.some((it) => it.rot);
    let guardado = false;

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - x0) / s;
      const dy = (ev.clientY - y0) / s;
      if (!guardado) {
        if (Math.hypot(dx, dy) * s < 3) return;
        guardarHistorial();
        guardado = true;
      }
      let ddx = dx;
      let ddy = dy;
      let v: number[] = [];
      let h: number[] = [];
      if (!ev.altKey && !conGiro) {
        const r = ajustar({ x: base.l + dx, y: base.t + dy, w: base.r - base.l, h: base.b - base.t }, ids);
        ddx = r.x - base.l;
        ddy = r.y - base.t;
        v = r.v;
        h = r.h;
      }
      setGuias({ v, h });
      setEls(
        getEls().map((it) => {
          const p = inicio.get(it.id!);
          return p ? { ...it, x: Math.round(p.x + ddx), y: Math.round(p.y + ddy) } : it;
        }),
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setGuias({ v: [], h: [] });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /** Guías de la página (posiciones en unidades). Sin guías, el campo desaparece del archivo. */
  const guiasPag = pagina.guias ?? {};
  const fijarGuias = (v: number[], h: number[]) => {
    const vv = [...new Set(v)].sort((a, b) => a - b);
    const hh = [...new Set(h)].sort((a, b) => a - b);
    paginaRef.current = { ...paginaRef.current, guias: vv.length || hh.length ? { ...(vv.length ? { v: vv } : {}), ...(hh.length ? { h: hh } : {}) } : undefined };
    onChangeRef.current(paginaRef.current);
  };

  /**
   * Arrastra una guía: nueva (desde una regla) o existente (por `indice`). Al soltarla sobre una regla o fuera de la
   * hoja se quita; con el imán de la cuadrícula activo se coloca sobre sus líneas.
   */
  function empezarGuia(eje: "v" | "h", e: React.PointerEvent, indice: number | null) {
    if (e.button !== 0 || !lienzo.current) return;
    e.preventDefault();
    e.stopPropagation();
    const limite = eje === "v" ? ANCHO_LIENZO : alto;
    const posicion = (ev: PointerEvent) => {
      const r = lienzo.current!.getBoundingClientRect();
      const bruto = eje === "v" ? (ev.clientX - r.left) / escala() : (ev.clientY - r.top) / escala();
      const paso = rejRef.current.iman ? rejRef.current.paso : 0;
      return Math.round(paso ? Math.round(bruto / paso) * paso : bruto);
    };
    const sobreRegla = (ev: PointerEvent) => {
      const v = viewport.current!.getBoundingClientRect();
      return eje === "v" ? ev.clientY - v.top < GROSOR_REGLA : ev.clientX - v.left < GROSOR_REGLA;
    };
    const estado = (ev: PointerEvent) => {
      const pos = posicion(ev);
      return { eje, pos, indice, borrar: sobreRegla(ev) || pos < 0 || pos > limite };
    };
    setGuiaTemp(estado(e.nativeEvent));
    const move = (ev: PointerEvent) => setGuiaTemp(estado(ev));
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const f = estado(ev);
      setGuiaTemp(null);
      const v = [...(paginaRef.current.guias?.v ?? [])];
      const h = [...(paginaRef.current.guias?.h ?? [])];
      const lista = eje === "v" ? v : h;
      if (indice !== null) lista.splice(indice, 1);
      if (!f.borrar) lista.push(f.pos);
      fijarGuias(v, h);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /** Arrastrar sobre la hoja vacía dibuja un rectángulo que selecciona lo que toca. */
  function empezarMarquesina(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setEditando(null);
    const sumar = e.shiftKey || e.ctrlKey || e.metaKey;
    const previa = sumar ? selRef.current : [];
    if (!sumar) setSel([]);
    const rect = lienzo.current!.getBoundingClientRect();
    const s = escala();
    const p0 = { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s };
    let movido = false;

    const move = (ev: PointerEvent) => {
      const p = { x: (ev.clientX - rect.left) / s, y: (ev.clientY - rect.top) / s };
      if (!movido && Math.hypot(p.x - p0.x, p.y - p0.y) * s < 4) return;
      movido = true;
      const c: Caja = { l: Math.min(p0.x, p.x), t: Math.min(p0.y, p.y), r: Math.max(p0.x, p.x), b: Math.max(p0.y, p.y) };
      setMarquesina(c);
      const dentro = expandir(getEls().filter((it) => !it.bloqueado && !it.oculto && cruza(caja(it), c)).map((it) => it.id!));
      setSel([...new Set([...previa, ...dentro])]);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setMarquesina(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function empezarRedimension(e: React.PointerEvent, el: Elemento, t: Tirador) {
    e.stopPropagation();
    e.preventDefault();
    const s = escala();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const th = ((el.rot ?? 0) * Math.PI) / 180;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    guardarHistorial();

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - x0) / s;
      const dy = (ev.clientY - y0) / s;
      // Movimiento del ratón expresado en los ejes del propio elemento (que puede estar girado).
      const dlx = dx * cos + dy * sin;
      const dly = -dx * sin + dy * cos;
      let w2 = t.sx ? Math.max(10, el.w + t.sx * dlx) : el.w;
      let h2 = t.sy ? Math.max(10, el.h + t.sy * dly) : el.h;
      if (ev.shiftKey && t.sx && t.sy) {
        const r = el.w / el.h;
        if (w2 / el.w > h2 / el.h) h2 = w2 / r;
        else w2 = h2 * r;
      }
      // El borde opuesto se queda fijo: el centro se desplaza la mitad del cambio, girado.
      const ddx = (t.sx * (w2 - el.w)) / 2;
      const ddy = (t.sy * (h2 - el.h)) / 2;
      const cx = el.x + el.w / 2 + ddx * cos - ddy * sin;
      const cy = el.y + el.h / 2 + ddx * sin + ddy * cos;
      let nx = Math.round(cx - w2 / 2);
      let ny = Math.round(cy - h2 / 2);
      let nw = Math.round(w2);
      let nh = Math.round(h2);
      // Imán a la cuadrícula: el borde que se arrastra se acerca a la línea más próxima (elementos sin girar).
      const paso = rejRef.current.iman && !el.rot && !ev.altKey ? rejRef.current.paso : 0;
      if (paso) {
        const sn = (v: number) => Math.round(v / paso) * paso;
        if (t.sx === 1) nw = Math.max(10, sn(nx + nw) - nx);
        else if (t.sx === -1) {
          const der = nx + nw;
          nx = sn(nx);
          nw = Math.max(10, der - nx);
        }
        if (t.sy === 1) nh = Math.max(10, sn(ny + nh) - ny);
        else if (t.sy === -1) {
          const aba = ny + nh;
          ny = sn(ny);
          nh = Math.max(10, aba - ny);
        }
      }
      setEls(getEls().map((it) => (it.id === el.id ? { ...it, x: nx, y: ny, w: nw, h: nh } : it)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /**
   * Redimensiona el conjunto seleccionado. El borde opuesto al tirador queda fijo.
   * En las esquinas la escala es proporcional y alcanza también al tamaño del texto, el relleno, el borde y las
   * esquinas redondas; en los lados solo se estiran las cajas (los elementos girados solo se desplazan).
   */
  function empezarRedimensionGrupo(e: React.PointerEvent, t: Tirador) {
    e.stopPropagation();
    e.preventDefault();
    const ids = selRef.current;
    const orig = getEls().filter((x) => ids.includes(x.id!)).map((x) => structuredClone(x));
    if (orig.length < 2) return;
    const base = unir(orig.map(caja));
    const W = base.r - base.l;
    const H = base.b - base.t;
    const ax = t.sx === -1 ? base.r : t.sx === 1 ? base.l : (base.l + base.r) / 2;
    const ay = t.sy === -1 ? base.b : t.sy === 1 ? base.t : (base.t + base.b) / 2;
    const esquina = t.sx !== 0 && t.sy !== 0;
    const s = escala();
    const x0 = e.clientX;
    const y0 = e.clientY;
    guardarHistorial();

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - x0) / s;
      const dy = (ev.clientY - y0) / s;
      const W2 = t.sx ? Math.max(10, W + t.sx * dx) : W;
      const H2 = t.sy ? Math.max(10, H + t.sy * dy) : H;
      let kx = W2 / W;
      let ky = H2 / H;
      if (esquina) kx = ky = Math.max(kx, ky);

      const nuevos = new Map<string, Elemento>();
      for (const o of orig) {
        const cx = ax + (o.x + o.w / 2 - ax) * kx;
        const cy = ay + (o.y + o.h / 2 - ay) * ky;
        let w = o.w;
        let h = o.h;
        if (esquina) {
          w = o.w * kx;
          h = o.h * kx;
        } else if (!o.rot) {
          w = o.w * kx;
          h = o.h * ky;
        }
        w = Math.max(4, w);
        h = Math.max(4, h);
        const r = { ...o, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), h: Math.round(h) } as Elemento;
        if (esquina) {
          if (r.tipo === "texto" && o.tipo === "texto") {
            r.tam = Math.max(4, Math.round((o.tam ?? 24) * kx * 10) / 10);
            if (o.relleno) r.relleno = Math.round(o.relleno * kx);
          }
          if ("radio" in o && o.radio && "radio" in r) r.radio = Math.round(o.radio * kx);
          if (o.tipo === "forma" && r.tipo === "forma" && o.borde) r.borde = Math.max(1, Math.round(o.borde * kx));
        }
        nuevos.set(o.id!, r);
      }
      setEls(getEls().map((it) => nuevos.get(it.id!) ?? it));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /** Gira el conjunto alrededor de su centro: cada elemento se traslada y suma el mismo ángulo. */
  function empezarGiroGrupo(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const ids = selRef.current;
    const orig = getEls().filter((x) => ids.includes(x.id!)).map((x) => structuredClone(x));
    if (orig.length < 2) return;
    const base = unir(orig.map(caja));
    const gx = (base.l + base.r) / 2;
    const gy = (base.t + base.b) / 2;
    const rect = lienzo.current!.getBoundingClientRect();
    const s = escala();
    const cx = rect.left + gx * s;
    const cy = rect.top + gy * s;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    guardarHistorial();

    const move = (ev: PointerEvent) => {
      let d = ((Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0) * 180) / Math.PI;
      if (ev.shiftKey) d = Math.round(d / 15) * 15;
      const rad = (d * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const nuevos = new Map<string, Elemento>();
      for (const o of orig) {
        const vx = o.x + o.w / 2 - gx;
        const vy = o.y + o.h / 2 - gy;
        const ncx = gx + vx * cos - vy * sin;
        const ncy = gy + vx * sin + vy * cos;
        const rot = ((((((o.rot ?? 0) + d + 180) % 360) + 360) % 360) - 180);
        nuevos.set(o.id!, { ...o, x: Math.round(ncx - o.w / 2), y: Math.round(ncy - o.h / 2), rot: Math.round(rot) || undefined } as Elemento);
      }
      setEls(getEls().map((it) => nuevos.get(it.id!) ?? it));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function empezarGiro(e: React.PointerEvent, el: Elemento) {
    e.stopPropagation();
    e.preventDefault();
    const rect = lienzo.current!.getBoundingClientRect();
    const s = escala();
    const cx = rect.left + (el.x + el.w / 2) * s;
    const cy = rect.top + (el.y + el.h / 2) * s;
    guardarHistorial();

    const move = (ev: PointerEvent) => {
      let ang = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      if (ev.shiftKey) ang = Math.round(ang / 15) * 15;
      ang = ((((ang + 180) % 360) + 360) % 360) - 180;
      setEls(getEls().map((it) => (it.id === el.id ? { ...it, rot: Math.round(ang) || undefined } : it)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /* ----------------------- Soltar desde la paleta o archivos ---------- */

  function posicionEn(e: React.DragEvent) {
    const rect = lienzo.current!.getBoundingClientRect();
    const s = escala();
    return { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s };
  }

  function dimensionesImagen(src: string): Promise<{ w: number; h: number } | null> {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res(null);
      img.src = src;
    });
  }

  /** Sube un archivo y lo coloca como imagen o video; una foto sobre un marco o imagen ya colocados la rellena. */
  async function incorporarArchivo(file: File, x: number, y: number) {
    try {
      setAviso(`Subiendo ${file.name}…`);
      const src = await subir(file);
      const esVideo = /\.(mp4|webm)$/i.test(src);
      // Una foto soltada sobre un marco o una imagen ya colocados la rellena, conservando su forma y tamaño.
      const marco = esVideo ? undefined : elementoEn(x, y, ["imagen"]);
      if (marco) {
        aplicar(getEls().map((it) => (it.id === marco.id ? ({ ...it, src } as Elemento) : it)));
        setSel([marco.id!]);
        setAviso(null);
        return;
      }
      const base = elementoNuevo(esVideo ? "video" : "imagen", x, y);
      let el: Elemento = { ...base, src } as Elemento;
      if (!esVideo) {
        const d = await dimensionesImagen(src);
        if (d) {
          const w = Math.min(440, d.w);
          const h = Math.round((w * d.h) / d.w);
          el = { ...el, w, h, x: Math.max(0, Math.round(x - w / 2)), y: Math.max(0, Math.round(y - h / 2)), alt: file.name.replace(/\.[^.]+$/, "") } as Elemento;
        }
      }
      aplicar([...getEls(), el]);
      setSel([el.id!]);
      setAviso(null);
    } catch (err) {
      setAviso(mensajeSimple(err, "No se pudo subir el archivo"));
    }
  }

  /** Coloca en la hoja un archivo que ya estaba subido (galería «Subidos»): foto con su proporción, o video. Sin posición, al centro de lo que se ve. */
  async function colocarSubido(src: string, x?: number, y?: number) {
    const esVideo = /\.(mp4|webm)$/i.test(src);
    const marco = x !== undefined && y !== undefined && !esVideo ? elementoEn(x, y, ["imagen"]) : undefined;
    if (marco) {
      aplicar(getEls().map((it) => (it.id === marco.id ? ({ ...it, src } as Elemento) : it)));
      setSel([marco.id!]);
      return;
    }
    const base = elementoNuevo(esVideo ? "video" : "imagen", x, y);
    let el: Elemento = { ...base, src } as Elemento;
    if (!esVideo) {
      const d = await dimensionesImagen(src);
      if (d) {
        const w = Math.min(440, d.w);
        const h = Math.round((w * d.h) / d.w);
        const cx = base.x + base.w / 2;
        const cy = base.y + base.h / 2;
        el = { ...el, w, h, x: Math.max(0, Math.round(cx - w / 2)), y: Math.max(0, Math.round(cy - h / 2)), alt: decodeURIComponent(src.split("/").pop() ?? "").replace(/\.[^.]+$/, "") } as Elemento;
      }
    }
    aplicar([...getEls(), el]);
    setSel([el.id!]);
  }

  async function alSoltar(e: React.DragEvent) {
    e.preventDefault();
    const { x, y } = posicionEn(e);
    const dato = e.dataTransfer.getData(TIPO_DND);
    if (dato.startsWith("subido:")) {
      await colocarSubido(dato.slice(7), x, y);
      return;
    }
    if (dato.startsWith("icono:")) {
      agregarIcono(dato.slice(6), x, y);
      return;
    }
    if (dato.startsWith("mio:")) {
      agregarMio(dato.slice(4), x, y);
      return;
    }
    if (dato.startsWith("preset:")) {
      agregar(dato.slice(7) as PresetElemento, x, y);
      return;
    }
    if (dato.startsWith("bloque:")) {
      agregarBloque(dato.slice(7), x, y);
      return;
    }
    if (dato.startsWith("boton:")) {
      agregarBoton(dato.slice(6), x, y);
      return;
    }
    if (dato.startsWith("logo:")) {
      agregarLogo(dato.slice(5) as LogoId, x, y);
      return;
    }
    if (dato.startsWith("molde:")) {
      const [, id, modo] = dato.split(":");
      const molde = id as MoldeId;
      // Soltado sobre una foto, video o forma, se lo aplica; si no, crea un marco (o una forma).
      const objetivo = elementoEn(x, y, ["imagen", "video", "forma"]);
      if (objetivo) {
        aplicarMoldeA(objetivo.id!, molde);
        setSel([objetivo.id!]);
      } else {
        const el = modo === "forma" ? elementoFormaMolde(molde, x, y) : elementoMarco(molde, x, y);
        aplicar([...getEls(), el]);
        setSel([el.id!]);
      }
      return;
    }
    if (dato) {
      agregar(dato as PresetElemento, x, y);
      return;
    }
    for (const file of Array.from(e.dataTransfer.files)) await incorporarArchivo(file, x, y);
  }

  /* ------------------------------ Teclado ----------------------------- */

  const acc = useRef({ deshacer, rehacer, eliminar, duplicar, agrupar, desagrupar, aplicar, editando, copiarEstiloSel, pegarEstiloSel });
  acc.current = { deshacer, rehacer, eliminar, duplicar, agrupar, desagrupar, aplicar, editando, copiarEstiloSel, pegarEstiloSel };
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target;
      if (t instanceof Element && t.closest("input,textarea,select,[contenteditable]")) return;
      const a = acc.current;
      const k = ev.key.toLowerCase();
      const ctrl = ev.ctrlKey || ev.metaKey;
      if (ctrl && k === "z") {
        ev.preventDefault();
        if (ev.shiftKey) a.rehacer();
        else a.deshacer();
        return;
      }
      if (ctrl && k === "y") {
        ev.preventDefault();
        a.rehacer();
        return;
      }
      if (ctrl && k === "'") {
        ev.preventDefault();
        setRej({ cuadricula: !rejRef.current.cuadricula });
        return;
      }
      if (ctrl && (k === "+" || k === "=" || k === "-" || k === "0")) {
        ev.preventDefault();
        if (k === "0") fijarVista(ajuste("ancho"));
        else zoomCentro(vistaRef.current.s * (k === "-" ? 0.8 : 1.25));
        return;
      }
      if (k === "escape" && recortandoRef.current) {
        setRecortando(null);
        return;
      }
      if (a.editando) return;
      if (ctrl && ev.altKey && (k === "c" || k === "v")) {
        ev.preventDefault();
        if (k === "c") a.copiarEstiloSel();
        else a.pegarEstiloSel();
        return;
      }
      if (!ctrl && k === "h") {
        setMano((m) => !m);
        return;
      }
      if (ctrl && k === "a") {
        ev.preventDefault();
        setSel((paginaRef.current.elementos ?? []).filter((e) => !e.bloqueado && !e.oculto).map((e) => e.id!).filter(Boolean));
        return;
      }
      const ids = selRef.current;
      if (ids.length === 0) return;
      if (k === "delete" || k === "backspace") {
        ev.preventDefault();
        a.eliminar();
      } else if (ctrl && k === "g") {
        ev.preventDefault();
        if (ev.shiftKey) a.desagrupar();
        else a.agrupar();
      } else if (ctrl && k === "d") {
        ev.preventDefault();
        a.duplicar();
      } else if (k === "escape") {
        setSel([]);
      } else if (k.startsWith("arrow")) {
        ev.preventDefault();
        const paso = ev.shiftKey ? 10 : 1;
        const dx = k === "arrowleft" ? -paso : k === "arrowright" ? paso : 0;
        const dy = k === "arrowup" ? -paso : k === "arrowdown" ? paso : 0;
        a.aplicar(
          (paginaRef.current.elementos ?? []).map((e) => (ids.includes(e.id!) && !e.bloqueado ? { ...e, x: e.x + dx, y: e.y + dy } : e)),
          `${ids.join(",")}:flechas`,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Copiar / cortar / pegar con el teclado (eventos del navegador, no atajos propios: así viajan por el portapapeles real). */
  const pp = useRef({ copiar, cortar, pegarDesdeEvento });
  pp.current = { copiar, cortar, pegarDesdeEvento };
  useEffect(() => {
    const editable = (t: EventTarget | null) => t instanceof Element && !!t.closest("input,textarea,select,[contenteditable]");
    let mayus = false;
    const tecla = (ev: KeyboardEvent) => {
      mayus = ev.shiftKey;
    };
    const onCopy = (ev: ClipboardEvent) => {
      if (editable(ev.target) || acc.current.editando) return;
      const c = pp.current.copiar();
      if (!c) return;
      ev.preventDefault();
      ev.clipboardData?.setData("text/plain", JSON.stringify(c));
    };
    const onCut = (ev: ClipboardEvent) => {
      if (editable(ev.target) || acc.current.editando) return;
      const c = pp.current.cortar();
      if (!c) return;
      ev.preventDefault();
      ev.clipboardData?.setData("text/plain", JSON.stringify(c));
    };
    const onPaste = (ev: ClipboardEvent) => {
      if (editable(ev.target) || acc.current.editando || !ev.clipboardData) return;
      if (pp.current.pegarDesdeEvento(ev.clipboardData, mayus)) ev.preventDefault();
    };
    window.addEventListener("keydown", tecla);
    window.addEventListener("keyup", tecla);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("keyup", tecla);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
    };
  }, []);

  /* ------------------------------- Dibujo ----------------------------- */

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMovil(mq.matches);
    const alCambiar = () => setMovil(mq.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);
  // En celular el cajón se abre solo al seleccionar un elemento y se cierra al quedar sin selección.
  const haySeleccion = seleccion.length > 0;
  useEffect(() => {
    if (movil) setCajon(haySeleccion);
  }, [movil, haySeleccion]);

  /** Alto del área de trabajo (hoja, riel y panel de herramientas). */
  const altoTrabajo = completa ? "calc(100vh - 9rem)" : `max(24rem, calc(100vh - ${17.5 + reservaInferior}rem))`;
  /** Colores que ya usa esta página (fondo, textos, formas, bordes…): el selector de color los ofrece primero. */
  const coloresPagina = (() => {
    const set = new Set<string>();
    const sumar = (c: unknown) => {
      if (typeof c === "string" && esColorValido(c)) set.add(c.startsWith("#") ? c.toLowerCase() : c);
    };
    sumar(pagina.fondo);
    for (const e of elementos) {
      const r = e as unknown as Record<string, unknown>;
      for (const k of ["color", "colorBorde", "fondo", "colorFondo"]) sumar(r[k]);
    }
    return [...set].slice(0, 16);
  })();
  /* ------------------------- Menú del clic derecho ------------------------- */

  /** Enciende o apaga «bloqueado» u «oculto» en toda la selección (si todos lo tienen, se quita; si no, se pone). */
  const alternarCampoSel = (campo: "oculto") => {
    const ids = selRef.current;
    const elegidos = getEls().filter((e) => ids.includes(e.id!));
    if (elegidos.length === 0) return;
    const poner = !elegidos.every((e) => e[campo]);
    aplicar(getEls().map((e) => (ids.includes(e.id!) ? ({ ...e, [campo]: poner ? true : undefined } as Elemento) : e)));
  };

  /** Sube o baja un solo escalón en el orden de las capas a todo lo elegido (el bloque se mueve junto). */
  const moverUnaCapa = (dir: "subir" | "bajar") => {
    const ids = new Set(selRef.current);
    const l = [...getEls()];
    if (dir === "subir") {
      for (let i = l.length - 2; i >= 0; i--) if (ids.has(l[i].id!) && !ids.has(l[i + 1].id!)) [l[i], l[i + 1]] = [l[i + 1], l[i]];
    } else {
      for (let i = 1; i < l.length; i++) if (ids.has(l[i].id!) && !ids.has(l[i - 1].id!)) [l[i], l[i - 1]] = [l[i - 1], l[i]];
    }
    aplicar(l);
  };

  /** Abre (y lleva a la vista) un panel de la columna derecha, igual que los botones de la barra sobre la hoja. */
  const abrirPanelProp = (titulo: string) => {
    setLateral("propiedades");
    if (movil) setCajon(true);
    setTimeout(() => window.dispatchEvent(new CustomEvent("abrir-panel", { detail: titulo })), 80);
  };

  const itemsElemento = (): ItemMenu[] => {
    const ids = selRef.current;
    const lista = getEls();
    const elegidos = lista.filter((x) => ids.includes(x.id!));
    if (elegidos.length === 0) return [];
    const uno = elegidos.length === 1 ? elegidos[0] : null;
    const enFrente = lista.slice(-elegidos.length).every((x) => ids.includes(x.id!));
    const alFondo = lista.slice(0, elegidos.length).every((x) => ids.includes(x.id!));
    const todosBloqueados = elegidos.every((x) => x.bloqueado);
    const todosOcultos = elegidos.every((x) => x.oculto);
    const hayGrupo = elegidos.some((x) => x.grupo);
    const items: ItemMenu[] = [];
    if (uno?.tipo === "texto") items.push({ texto: "Editar texto", icono: "✎", onClick: () => setEditando(uno.id!) });
    if (uno?.tipo === "imagen") {
      items.push({ texto: "Reemplazar foto…", icono: "⇄", onClick: () => setBiblioteca({ modo: "subidos", reemplazar: true }) });
      if (uno.src && !uno.comparar) items.push({ texto: "Recortar o acercar", onClick: () => setRecortando(uno.id!) });
      if (uno.src) items.push({ texto: "Quitar fondo…", onClick: () => setQuitandoFondo(uno.id!) });
    }
    if (uno?.tipo === "icono") items.push({ texto: "Cambiar figura o icono…", icono: "⇄", onClick: () => setBiblioteca({ modo: uno.icono.startsWith("fig-") ? "figuras" : "iconos", reemplazar: true }) });
    if (items.length) items.push({ separador: true });
    items.push(
      { texto: "Copiar", atajo: "Ctrl+C", onClick: copiarBoton },
      { texto: "Cortar", atajo: "Ctrl+X", onClick: cortarBoton },
      { texto: "Pegar", atajo: "Ctrl+V", onClick: pegarBoton },
      { texto: "Duplicar", atajo: "Ctrl+D", onClick: duplicar },
      { separador: true },
      { titulo: "Orden de las capas" },
      { texto: "Traer al frente", icono: "⇈", deshabilitado: enFrente, onClick: () => moverGrupo("frente") },
      { texto: "Traer adelante", icono: "↑", deshabilitado: enFrente, onClick: () => moverUnaCapa("subir") },
      { texto: "Enviar atrás", icono: "↓", deshabilitado: alFondo, onClick: () => moverUnaCapa("bajar") },
      { texto: "Enviar al fondo", icono: "⇊", deshabilitado: alFondo, onClick: () => moverGrupo("atras") },
      { separador: true },
    );
    if (elegidos.length > 1) items.push({ texto: "Agrupar", atajo: "Ctrl+G", onClick: agrupar });
    if (hayGrupo) items.push({ texto: "Desagrupar", atajo: "Ctrl+Mayús+G", onClick: desagrupar });
    items.push(
      { texto: todosBloqueados ? "Desbloquear" : "Bloquear", icono: todosBloqueados ? "🔓" : "🔒", onClick: alternarBloqueoSeleccion },
      { texto: todosOcultos ? "Mostrar" : "Ocultar", icono: todosOcultos ? "👁" : "🚫", onClick: () => alternarCampoSel("oculto") },
      { separador: true },
    );
    if (uno) {
      items.push(
        { texto: "Animar…", icono: "✦", onClick: () => abrirPanelProp("Animación de entrada") },
        { texto: "Posición y tamaño…", onClick: () => abrirPanelProp("Posición y tamaño") },
        { texto: "Enlace…", icono: "🔗", onClick: () => abrirPanelProp("Enlace") },
        { separador: true },
      );
    }
    items.push(
      { texto: "Copiar estilo", atajo: "Ctrl+Alt+C", onClick: copiarEstiloSel },
      { texto: "Pegar estilo", atajo: "Ctrl+Alt+V", onClick: pegarEstiloSel },
      { separador: true },
      { texto: elegidos.length > 1 ? "Eliminar " + elegidos.length + " elementos" : "Eliminar", icono: "🗑", atajo: "Supr", peligro: true, onClick: eliminar },
    );
    return items;
  };

  const itemsFondo = (): ItemMenu[] => [
    { texto: "Pegar", atajo: "Ctrl+V", onClick: pegarBoton },
    { texto: "Seleccionar todo", atajo: "Ctrl+A", onClick: () => setSel(getEls().filter((e) => !e.bloqueado && !e.oculto).map((e) => e.id!).filter(Boolean)) },
    { separador: true },
    { texto: "Agregar un titular", icono: "T", onClick: () => agregar("titular") },
    { texto: "Agregar un párrafo", onClick: () => agregar("parrafo") },
    { texto: "Agregar una imagen", icono: "🖼", onClick: () => agregar("imagen") },
    { separador: true },
    { texto: "Ver la hoja entera", onClick: () => ajustarVista("pagina") },
    { texto: "Fondo, alto y transición…", onClick: () => abrirPanelProp("Hoja") },
  ];

  /** Clic derecho en la hoja: sobre un elemento lo elige (con su grupo) y muestra sus acciones; en el fondo, las de la página. Dentro de un texto en edición se deja el menú del navegador. */
  function alClicDerecho(e: React.MouseEvent) {
    const t = e.target as Element;
    if (t.closest("[contenteditable],input,textarea,select")) return;
    const id = t.closest("[data-elid]")?.getAttribute("data-elid");
    if (id && getEls().some((x) => x.id === id)) {
      if (!selRef.current.includes(id)) {
        const ids = expandir([id]);
        selRef.current = ids;
        setSel(ids);
      }
      setEditando(null);
      abrirMenu(e, itemsElemento());
    } else {
      selRef.current = [];
      setSel([]);
      abrirMenu(e, itemsFondo());
    }
  }

  /** Fotos con archivo de esta página: de ellas salen los «Colores de las fotos» del selector. */
  const fotosPagina = [...new Set(elementos.flatMap((e) => (e.tipo === "imagen" && e.src ? [e.src] : [])))];
  /** Cuentagotas de la hoja (lo pide el selector de color): mientras está activo, `resolver` espera el color elegido. */
  const [cuentagotas, setCuentagotas] = useState<null | { resolver: (c: string | null) => void }>(null);
  const pedirColor = () => new Promise<string | null>((resolver) => setCuentagotas({ resolver }));
  /** Tiradores de la selección (el cuentagotas los reconoce por su borde terracota y no los toma como color). */
  const handle = "absolute h-2.5 w-2.5 border border-terracota bg-white pointer-coarse:h-5 pointer-coarse:w-5";
  const cajaGrupo = seleccion.length > 1 ? unir(seleccion.map(caja)) : null;

  return (
    <ColoresPaginaContext.Provider value={coloresPagina}>
    <FotosPaginaContext.Provider value={fotosPagina}>
    <CuentagotasContext.Provider value={pedirColor}>
    {menuContextual}
    {cuentagotas && viewport.current && (
      <CuentagotasHoja
        area={viewport.current}
        hoja={lienzo.current}
        alTerminar={(c) => {
          cuentagotas.resolver(c);
          setCuentagotas(null);
        }}
      />
    )}
    <div
      className={`grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem] ${completa ? "fixed inset-0 z-50 overflow-y-auto bg-paper p-4" : ""}`}
    >
      <div className="min-w-0">
        {/* Fila superior: ayuda y edición (copiar, pegar, deshacer) */}
        <div className="mb-2 flex flex-wrap items-start gap-2">
          <details className="font-sans min-w-0 text-[0.7rem] text-ink-soft max-sm:hidden">
            <summary className="inline-block cursor-pointer select-none font-bold hover:text-ink">ⓘ Ayuda rápida</summary>
            <p className="mt-1 max-w-xl leading-relaxed">
              Elige una herramienta a la izquierda (clic para agregarla o arrástrala a la hoja) · Suelta imágenes o videos desde tu equipo sobre la hoja · Doble clic en un texto para
              escribir · Mayús/Ctrl + clic o arrastrar en vacío selecciona varios · Mayús al redimensionar conserva la proporción · Alt desactiva los imanes · Dos dedos
              (pantalla táctil) = zoom.
            </p>
          </details>
            <span className="ml-auto flex max-w-full min-w-0 gap-1 overflow-x-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap" role="toolbar" aria-label="Copiar, pegar y estilo">
              {onMover && (
              <button type="button" className={btnCls} onClick={() => onMover(seleccion)} disabled={sel.length === 0} title="Pasa lo seleccionado a todas las páginas (o lo deja solo en esta, según el modo)">
                {etiquetaMover}
              </button>
            )}
            <button type="button" className={btnCls} onClick={alternarBloqueoSeleccion} disabled={sel.length === 0} title="Bloquear la selección para no moverla por accidente (se desbloquea en la lista de capas)" aria-label="Bloquear la selección">🔒</button>
            <button type="button" className={btnCls} onClick={guardarSeleccion} disabled={sel.length === 0} title="Guardar la selección en Mis elementos (para usarla en cualquier edición)" aria-label="Guardar la selección en Mis elementos">☆</button>
            <button type="button" className={btnCls} onClick={copiarEstiloSel} disabled={sel.length !== 1} title="Copiar el estilo de este elemento (fuente, color, borde, sombras, animaciones…) sin su contenido (Ctrl+Alt+C)" aria-label="Copiar estilo">🖌</button>
            <button type="button" className={btnCls} onClick={pegarEstiloSel} disabled={sel.length === 0 || !estiloCopiado} title="Pegar el estilo copiado en los elementos seleccionados (Ctrl+Alt+V)" aria-label="Pegar estilo">🎨</button>
            <button type="button" className={btnCls} onClick={copiarBoton} disabled={sel.length === 0} title="Copiar (Ctrl+C): se puede pegar en otra página o edición" aria-label="Copiar">⧉</button>
              <button type="button" className={btnCls} onClick={cortarBoton} disabled={sel.length === 0} title="Cortar (Ctrl+X)" aria-label="Cortar">✂</button>
              <button type="button" className={btnCls} onClick={pegarBoton} title="Pegar (Ctrl+V). Ctrl+Mayús+V pega en el mismo lugar" aria-label="Pegar">▣</button>
              <button type="button" className={btnCls} onClick={() => setSel(elementos.filter((e) => !e.bloqueado && !e.oculto).map((e) => e.id!))} disabled={elementos.length === 0} title="Seleccionar todo (Ctrl+A)" aria-label="Seleccionar todo">
                ☑
              </button>
            </span>
        </div>
        {aviso && <p role="status" className="font-sans mb-2 text-xs font-bold text-terracota">{aviso}</p>}
        {(() => {
          const foto = recortando ? elementos.find((e) => e.id === recortando) : undefined;
          if (!foto || foto.tipo !== "imagen") return null;
          return (
            <div role="status" className="font-sans mb-2 flex flex-wrap items-center gap-3 border border-ocre bg-ocre/20 px-3 py-1.5 text-xs">
              <strong>✂ Encuadrando la foto:</strong>
              <span>arrástrala dentro de su marco.</span>
              <label className="flex items-center gap-2">
                Zoom
                <input
                  type="range"
                  min={100}
                  max={400}
                  step={5}
                  value={Math.round((foto.zoom ?? 1) * 100)}
                  onChange={(e) => {
                    const z = Number(e.target.value) / 100;
                    aplicar(getEls().map((it) => (it.id === foto.id ? ({ ...it, zoom: z > 1 ? z : undefined } as Elemento) : it)), `${foto.id}:zoom`);
                  }}
                  className="w-40 accent-[#068562]"
                  aria-label="Zoom de la foto"
                />
                {Math.round((foto.zoom ?? 1) * 100)} %
              </label>
              <button type="button" className={btnCls} onClick={() => aplicar(getEls().map((it) => (it.id === foto.id ? ({ ...it, zoom: undefined, enfoque: undefined } as Elemento) : it)))}>
                Restablecer
              </button>
              <button type="button" className={`${btnCls} !bg-ink !text-paper`} onClick={() => setRecortando(null)}>
                ✓ Listo (Esc)
              </button>
            </div>
          );
        })()}
        {quitandoFondo &&
          (() => {
            const foto = elementos.find((e) => e.id === quitandoFondo);
            if (!foto || foto.tipo !== "imagen" || !foto.src) return null;
            return (
              <QuitarFondo
                src={foto.src}
                onAplicar={(src) => aplicar(getEls().map((it) => (it.id === foto.id ? ({ ...it, src } as Elemento) : it)))}
                onCerrar={() => setQuitandoFondo(null)}
              />
            );
          })()}

        <div className="flex flex-col gap-2 lg:flex-row">
          {/* Riel de herramientas */}
          <nav
            aria-label="Herramientas"
            data-tour="riel"
            className="flex shrink-0 gap-1 overflow-x-auto border border-ink/30 bg-paper-deep/60 p-1 lg:h-(--alto-trabajo) lg:w-[4.5rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden"
            style={{ "--alto-trabajo": altoTrabajo } as React.CSSProperties}
          >
            {RIEL.map((it) => {
              const activo = !!it.modo && biblioteca?.modo === it.modo;
              return (
                <button
                  key={it.id}
                  type="button"
                  data-tour={`riel-${it.id}`}
                  draggable={!!it.preset}
                  onDragStart={(e) => {
                    if (!it.preset) return;
                    e.dataTransfer.setData(TIPO_DND, it.preset);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => {
                    if (it.preset) agregar(it.preset);
                    else setBiblioteca((b) => (b?.modo === it.modo ? null : { modo: it.modo! }));
                  }}
                  aria-pressed={it.modo ? activo : undefined}
                  title={it.titulo}
                  className={`font-sans flex w-16 shrink-0 flex-col items-center gap-1 px-1 py-2 text-[0.62rem] font-bold leading-tight lg:w-full ${activo ? "bg-ink text-paper" : "text-ink hover:bg-white/70"}`}
                >
                  {it.icono}
                  <span>{it.etiqueta}</span>
                </button>
              );
            })}
          </nav>

          {/* Panel de la herramienta elegida (bloques, botones, iconos…) */}
          {biblioteca && (
            <div className="h-96 shrink-0 lg:h-(--alto-trabajo) lg:w-80" style={{ "--alto-trabajo": altoTrabajo } as React.CSSProperties}>
              {biblioteca.modo === "plantillas" ? (
                <PlantillasModal variante="panel" paginaActual={pagina} numeroPagina={(indice ?? 0) + 1} onAplicar={(p, n, m) => onAplicarPlantilla?.(p, n, m)} onCerrar={() => setBiblioteca(null)} />
              ) : (
              <BibliotecaLienzo
                modo={biblioteca.modo}
                reemplazando={!!biblioteca.reemplazar && (unico?.tipo === "icono" || unico?.tipo === "imagen")}
                hayMoldeable={!!unico && (unico.tipo === "imagen" || unico.tipo === "video" || unico.tipo === "forma")}
                onIcono={(id) => {
                  if (biblioteca.reemplazar && unico?.tipo === "icono") {
                    cambiar({ icono: id });
                    setBiblioteca((b) => (b ? { ...b, reemplazar: false } : b));
                  } else agregarIcono(id);
                }}
                onMolde={(id, comoForma) => aplicarMolde(id, comoForma)}
                onLogo={(id) => agregarLogo(id)}
                onBoton={(id) => agregarBoton(id)}
                onBloque={(id) => agregarBloque(id)}
                onPreset={(id) => agregar(id)}
                mios={mios}
                edicionId={edicionId ?? ""}
                onSubido={(src) => {
                  if (biblioteca.reemplazar && unico?.tipo === "imagen") {
                    // La descripción de fábrica de la plantilla ya no describe la foto nueva: se quita para que la revisión la pida.
                    cambiar({ src, ...(esAltDeEjemplo(unico.alt) ? { alt: undefined } : {}) });
                    setBiblioteca((b) => (b ? { ...b, reemplazar: false } : b));
                  } else colocarSubido(src);
                }}
                seleccionados={seleccion.length}
                onGuardarSeleccion={guardarSeleccion}
                onMio={(id) => agregarMio(id)}
                onRenombrarMio={renombrarMio}
                onBorrarMio={borrarMio}
                onCerrar={() => setBiblioteca(null)}
              />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
        {/* Barra contextual: lo principal de lo que está elegido (al estilo de Canva) */}
        <BarraContextual
          el={unico ?? undefined}
          n={seleccion.length}
          pagina={pagina}
          cambiar={(p, c) => cambiar(p as Partial<Elemento>, c)}
          cambiarPagina={(patch) => onChange({ ...pagina, ...patch })}
          onAlinear={alinear}
          abrirPanel={(titulo) => {
            setLateral("propiedades");
            if (movil) setCajon(true);
            setTimeout(() => window.dispatchEvent(new CustomEvent("abrir-panel", { detail: titulo })), 80);
          }}
          acciones={{
            duplicar,
            eliminar,
            frente: () => moverGrupo("frente"),
            atras: () => moverGrupo("atras"),
            agrupar: seleccion.length > 1 ? agrupar : undefined,
            desagrupar: seleccion.length > 1 && seleccion.some((e) => e.grupo) ? desagrupar : undefined,
            recortar: unico?.tipo === "imagen" && unico.src && !unico.comparar ? () => setRecortando(unico.id!) : undefined,
            quitarFondo: unico?.tipo === "imagen" && unico.src ? () => setQuitandoFondo(unico.id!) : undefined,
            reemplazarImagen: unico?.tipo === "imagen" ? () => setBiblioteca({ modo: "subidos", reemplazar: true }) : undefined,
            editarTexto: unico?.tipo === "texto" ? () => setEditando(unico.id!) : undefined,
            cambiarIcono: unico?.tipo === "icono" ? () => setBiblioteca({ modo: unico.icono.startsWith("fig-") ? "figuras" : "iconos", reemplazar: true }) : undefined,
          }}
        />

        {/* Hoja */}
        <div
          ref={viewport}
          data-tour="hoja"
          onPointerDownCapture={alPunteroVista}
          onContextMenu={alClicDerecho}
          onDoubleClick={(e) => {
            // Doble clic en el fondo gris (fuera de la hoja): vuelve a la vista de la hoja entera, como el botón «Entera».
            if (e.target === e.currentTarget) ajustarVista("pagina");
          }}
          className={`relative overflow-hidden border border-ink/30 ${completa ? "" : "h-[max(22rem,calc(100svh-15rem))] md:h-[calc(var(--alto-trabajo)-3.5rem)]"} ${
            arrastrandoVista ? "[&_*]:cursor-grabbing!" : mano || espacio ? "[&_*]:cursor-grab!" : ""
          }`}
          style={{
            ...(completa ? { height: `calc(${altoTrabajo} - 3.5rem)` } : { "--alto-trabajo": altoTrabajo }),
            backgroundColor: "#cbd5e1",
            backgroundImage: "radial-gradient(rgba(28,24,20,.2) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            cursor: arrastrandoVista ? "grabbing" : mano || espacio ? "grab" : "default",
            touchAction: "none",
          }}
        >
          {rej.reglas && (
            <Reglas
              vista={vista}
              alto={alto}
              ancho={ANCHO_LIENZO}
              seleccion={seleccion.length ? unir(seleccion.map(caja)) : null}
              contenedor={viewport}
              onGuia={(eje, e) => empezarGuia(eje, e, null)}
            />
          )}
          <div style={{ position: "absolute", left: 0, top: 0, width: anchoPx, transform: `translate(${vista.x}px, ${vista.y}px)` }}>
            <div
              ref={lienzo}
              onPointerDown={empezarMarquesina}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(TIPO_DND) || e.dataTransfer.types.includes("Files")) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }
              }}
              onDrop={alSoltar}
              className="relative overflow-visible shadow-[0_10px_40px_-12px_rgba(28,24,20,0.45)] ring-1 ring-ink/20"
              style={{
                width: anchoPx,
                containerType: "inline-size",
                aspectRatio: `${ANCHO_LIENZO} / ${alto}`,
                background: colorCss(pagina.fondo, "var(--paper)"),
                userSelect: "none",
              }}
            >
              {fantasma && fantasmaDetras && <Fantasma elementos={fantasma} refs={refs} />}
              {elementos.filter((e) => !e.oculto).map((el) => {
                const activo = sel.includes(el.id!);
                const solo = activo && unico?.id === el.id && !el.bloqueado;
                return (
                  <ElementoVista
                    key={el.id}
                    el={el}
                    refs={refs}
                    editor={{
                      seleccionado: activo,
                      bloqueado: !!el.bloqueado,
                      editando: editando === el.id,
                      contenidoEdicion:
                        editando === el.id && el.tipo === "texto" ? (
                          <EditorTexto
                            contenidoInicial={el.contenido ?? desdeTextoPlano(el.texto)}
                            baseTam={el.tam ?? 24}
                            alCambiar={(contenido, texto) =>
                              aplicar(
                                getEls().map((it) => (it.id === el.id ? ({ ...it, contenido, texto } as Elemento) : it)),
                                `${el.id}:texto`,
                              )
                            }
                            alSalir={() => setEditando(null)}
                            lienzo={lienzo.current}
                            caja={caja(el)}
                            alto={alto}
                            escala={vista.s}
                          />
                        ) : undefined,
                      globos:
                        solo && el.tipo === "imagen" && el.globos?.length
                          ? {
                              seleccionado: globoSel,
                              onSeleccionar: setGloboSel,
                              onCambiar: (i, patch) =>
                                aplicar(
                                  getEls().map((it) =>
                                    it.id === el.id && it.tipo === "imagen" ? ({ ...it, globos: (it.globos ?? []).map((g, k) => (k === i ? { ...g, ...patch } : g)) } as Elemento) : it,
                                  ),
                                  `${el.id}:globo${i}`,
                                ),
                            }
                          : undefined,
                      onPointerDown: el.bloqueado ? undefined : (e) => (recortando === el.id ? empezarRecorte(e, el) : empezarMover(e, el)),
                      onDoubleClick: el.bloqueado ? undefined : () => {
                        // Doble clic "entra" al grupo: selecciona solo este elemento; en un texto, además lo edita; en una foto, la deja encuadrar.
                        setSel([el.id!]);
                        if (el.tipo === "texto") setEditando(el.id!);
                        else if (el.tipo === "imagen" && el.src && !el.comparar) setRecortando(el.id!);
                      },
                      children: (
                        <>
                          {el.movil === "solo" && (
                            <>
                              <span className="pointer-events-none absolute inset-0 border-2 border-dashed border-terracota" />
                              <span
                                className="pointer-events-none absolute left-0 top-0 bg-terracota px-1 font-sans font-bold uppercase text-paper"
                                style={{ fontSize: Math.max(9, 11 / Math.max(vista.s, 0.2)), lineHeight: 1.3, transform: "translateY(-100%)" }}
                              >
                                Solo en el celular
                              </span>
                            </>
                          )}
                          {verEjemplos && editando !== el.id && recortando !== el.id && ejemploDe(el) && (
                            <>
                              <span className="pointer-events-none absolute inset-0 border-2 border-dashed border-ocre" />
                              <span
                                className="pointer-events-none absolute left-0 top-0 bg-ocre px-1 font-sans font-bold uppercase text-ink"
                                style={{ fontSize: 11, lineHeight: 1.3, letterSpacing: "normal", transform: "translateY(-100%)" }}
                              >
                                {ejemploDe(el) === "foto" ? "Foto de ejemplo" : "Texto de ejemplo"}
                              </span>
                            </>
                          )}
                          {el.bloqueado && activo && (
                            <span
                              className="pointer-events-none absolute right-0 top-0 bg-ink px-1 font-sans font-bold uppercase text-paper"
                              style={{ fontSize: Math.max(9, 11 / Math.max(vista.s, 0.2)), lineHeight: 1.3, transform: "translateY(-100%)" }}
                            >
                              🔒 Bloqueado
                            </span>
                          )}
                          {recortando === el.id && (
                            <span className="pointer-events-none absolute inset-0 cursor-move border-2 border-dashed border-ocre" style={{ boxShadow: "0 0 0 9999px rgba(28,24,20,.0)" }} />
                          )}
                          {el.revelar && (
                            <span
                              className="pointer-events-none absolute bottom-0 left-0 bg-ocre px-1 font-sans font-bold uppercase text-ink"
                              style={{ fontSize: Math.max(9, 11 / Math.max(vista.s, 0.2)), lineHeight: 1.3, transform: "translateY(100%)" }}
                            >
                              Se revela al tocar
                            </span>
                          )}
                          {solo && editando !== el.id ? (
                          <>
                            {TIRADORES.map((t) => (
                              <span
                                key={`${t.sx}${t.sy}`}
                                className={handle}
                                onPointerDown={(e) => empezarRedimension(e, el, t)}
                                style={{
                                  left: `${(t.sx + 1) * 50}%`,
                                  top: `${(t.sy + 1) * 50}%`,
                                  transform: "translate(-50%,-50%)",
                                  cursor: t.cursor,
                                }}
                              />
                            ))}
                            <span
                              className="absolute h-3 w-3 rounded-full border border-terracota bg-white pointer-coarse:h-6 pointer-coarse:w-6"
                              onPointerDown={(e) => empezarGiro(e, el)}
                              title="Girar (Mayús: de 15° en 15°)"
                              style={{ left: "50%", top: -26, transform: "translateX(-50%)", cursor: "grab" }}
                            />
                            <span className="absolute w-px bg-terracota" style={{ left: "50%", top: -14, height: 14 }} />
                          </>
                        ) : null}
                        </>
                      ),
                    }}
                  />
                );
              })}

              {fantasma && !fantasmaDetras && <Fantasma elementos={fantasma} refs={refs} />}

              {/* Recuadro del conjunto seleccionado, con sus tiradores */}
              {cajaGrupo && (
                <div
                  data-caja-grupo
                  className="pointer-events-none absolute border border-dashed border-terracota"
                  style={{
                    left: `${(cajaGrupo.l / ANCHO_LIENZO) * 100}%`,
                    top: `${(cajaGrupo.t / alto) * 100}%`,
                    width: `${((cajaGrupo.r - cajaGrupo.l) / ANCHO_LIENZO) * 100}%`,
                    height: `${((cajaGrupo.b - cajaGrupo.t) / alto) * 100}%`,
                  }}
                >
                  {TIRADORES.map((t) => (
                    <span
                      key={`g${t.sx}${t.sy}`}
                      data-tirador-grupo={`${t.sx},${t.sy}`}
                      className={`${handle} pointer-events-auto`}
                      onPointerDown={(e) => empezarRedimensionGrupo(e, t)}
                      style={{
                        left: `${(t.sx + 1) * 50}%`,
                        top: `${(t.sy + 1) * 50}%`,
                        transform: "translate(-50%,-50%)",
                        cursor: t.cursor,
                      }}
                    />
                  ))}
                  <span
                    data-giro-grupo
                    className="pointer-events-auto absolute h-3 w-3 rounded-full border border-terracota bg-white"
                    onPointerDown={empezarGiroGrupo}
                    title="Girar el conjunto (Mayús: de 15° en 15°)"
                    style={{ left: "50%", top: -26, transform: "translateX(-50%)", cursor: "grab" }}
                  />
                  <span className="absolute w-px bg-terracota" style={{ left: "50%", top: -14, height: 14 }} />
                </div>
              )}

              {/* Rectángulo de selección */}
              {marquesina && (
                <div
                  className="pointer-events-none absolute border border-terracota bg-terracota/10"
                  style={{
                    left: `${(marquesina.l / ANCHO_LIENZO) * 100}%`,
                    top: `${(marquesina.t / alto) * 100}%`,
                    width: `${((marquesina.r - marquesina.l) / ANCHO_LIENZO) * 100}%`,
                    height: `${((marquesina.b - marquesina.t) / alto) * 100}%`,
                  }}
                />
              )}

              {/* Cuadrícula */}
              {rej.cuadricula && (() => {
                const px = rej.paso * vista.s;
                const px5 = px * 5;
                if (px5 < 5) return null;
                const lin = (alfa: number) => `rgba(47,74,107,${alfa})`;
                const capas: string[] = [];
                const tamanos: string[] = [];
                const fino = px >= 5;
                if (fino) {
                  capas.push(`linear-gradient(to right, ${lin(0.16)} 1px, transparent 1px)`, `linear-gradient(to bottom, ${lin(0.16)} 1px, transparent 1px)`);
                  tamanos.push(`${(rej.paso / ANCHO_LIENZO) * 100}% 100%`, `100% ${(rej.paso / alto) * 100}%`);
                }
                capas.push(`linear-gradient(to right, ${lin(0.3)} 1px, transparent 1px)`, `linear-gradient(to bottom, ${lin(0.3)} 1px, transparent 1px)`);
                tamanos.push(`${((rej.paso * 5) / ANCHO_LIENZO) * 100}% 100%`, `100% ${((rej.paso * 5) / alto) * 100}%`);
                return <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: capas.join(","), backgroundSize: tamanos.join(",") }} />;
              })()}

              {/* Guías de la página (se arrastran; llevarlas a una regla las quita) */}
              {(["v", "h"] as const).map((eje) =>
                (guiasPag[eje] ?? []).map((pos, i) =>
                  guiaTemp && guiaTemp.eje === eje && guiaTemp.indice === i ? null : (
                    <div
                      key={`${eje}${i}`}
                      title="Arrastra para mover la guía; llévala a la regla para quitarla"
                      onPointerDown={(e) => empezarGuia(eje, e, i)}
                      className="absolute z-10"
                      style={
                        eje === "v"
                          ? { left: `${(pos / ANCHO_LIENZO) * 100}%`, top: 0, bottom: 0, width: 9, marginLeft: -4, cursor: "ew-resize" }
                          : { top: `${(pos / alto) * 100}%`, left: 0, right: 0, height: 9, marginTop: -4, cursor: "ns-resize" }
                      }
                    >
                      <div className="pointer-events-none absolute bg-[#0ea5b7]" style={eje === "v" ? { left: 4, top: 0, bottom: 0, width: 1 } : { top: 4, left: 0, right: 0, height: 1 }} />
                    </div>
                  ),
                ),
              )}
              {guiaTemp && (
                <>
                  <div
                    className="pointer-events-none absolute z-10"
                    style={
                      guiaTemp.eje === "v"
                        ? { left: `${(guiaTemp.pos / ANCHO_LIENZO) * 100}%`, top: 0, bottom: 0, width: 1, background: guiaTemp.borrar ? "#068562" : "#0ea5b7", opacity: guiaTemp.borrar ? 0.5 : 1 }
                        : { top: `${(guiaTemp.pos / alto) * 100}%`, left: 0, right: 0, height: 1, background: guiaTemp.borrar ? "#068562" : "#0ea5b7", opacity: guiaTemp.borrar ? 0.5 : 1 }
                    }
                  />
                  <span
                    className="font-sans pointer-events-none absolute z-20 bg-ink px-1.5 py-0.5 text-[0.65rem] font-bold text-paper"
                    style={guiaTemp.eje === "v" ? { left: `${(guiaTemp.pos / ANCHO_LIENZO) * 100}%`, top: 4, marginLeft: 6 } : { top: `${(guiaTemp.pos / alto) * 100}%`, left: 4, marginTop: 6 }}
                  >
                    {guiaTemp.borrar ? "Soltar para quitar" : `${guiaTemp.eje === "v" ? "X" : "Y"} = ${guiaTemp.pos}`}
                  </span>
                </>
              )}

              {/* Guías de alineación */}
              {guias.v.map((v) => (
                <div key={`v${v}`} className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#e11d8f]" style={{ left: `${(v / ANCHO_LIENZO) * 100}%` }} />
              ))}
              {guias.h.map((h) => (
                <div key={`h${h}`} className="pointer-events-none absolute left-0 right-0 h-px bg-[#e11d8f]" style={{ top: `${(h / alto) * 100}%` }} />
              ))}

              {elementos.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
                  <p className="font-display text-2xl font-bold text-ink/70">Página en blanco</p>
                  <p className="font-sans max-w-sm text-sm text-ink-soft">
                    Empieza agregando algo con la barra de arriba, suelta aquí una imagen de tu equipo o parte de una plantilla ya diseñada.
                  </p>
                  <div className="pointer-events-auto flex flex-wrap justify-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                    <button type="button" className={btnCls} onClick={() => agregar("titular")}>+ Titular</button>
                    <button type="button" className={btnCls} onClick={() => agregar("parrafo")}>+ Párrafo</button>
                    <button type="button" className={btnCls} onClick={() => agregar("imagen")}>+ Imagen</button>
                    {onAplicarPlantilla && (
                      <button type="button" className={`${btnCls} !bg-ink !text-paper`} onClick={() => setBiblioteca({ modo: "plantillas" })}>▤ Usar una plantilla</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Vista: zoom y posición */}
        <div className="sticky bottom-0 z-20 mt-1 flex flex-wrap items-center gap-1.5 border-t border-ink/20 bg-paper py-1.5" role="toolbar" aria-label="Vista de la hoja">
          <button type="button" className={btnCls} onClick={() => zoomCentro(vista.s / 1.25)} title="Alejar (Ctrl y -)" aria-label="Alejar">−</button>
          <select
            aria-label="Zoom"
            className="font-sans h-[1.7rem] w-[4.6rem] border border-ink/40 bg-paper px-1 text-xs font-semibold max-md:h-10"
            value={ZOOMS.includes(Math.round(vista.s * 100)) ? String(Math.round(vista.s * 100)) : "otro"}
            onChange={(e) => e.target.value !== "otro" && zoomCentro(Number(e.target.value) / 100)}
          >
            {!ZOOMS.includes(Math.round(vista.s * 100)) && <option value="otro">{Math.round(vista.s * 100)} %</option>}
            {ZOOMS.map((z) => (
              <option key={z} value={z}>{z} %</option>
            ))}
          </select>
          <button type="button" className={btnCls} onClick={() => zoomCentro(vista.s * 1.25)} title="Acercar (Ctrl y +)" aria-label="Acercar">+</button>
          <button type="button" className={btnCls} onClick={() => ajustarVista("ancho")} title="Ajustar la hoja al ancho de la pantalla (Ctrl y 0)">Ancho</button>
          <button type="button" className={btnCls} onClick={() => ajustarVista("pagina")} title="Ver la hoja entera (o doble clic en el fondo gris)">Entera</button>
          <button type="button" className={btnCls} onClick={() => zoomCentro(1)} title="Tamaño real: 1 unidad = 1 píxel">100 %</button>
          <button
            type="button"
            className={`${btnCls} ${mano ? "!bg-ink !text-paper" : ""}`}
            onClick={() => setMano((m) => !m)}
            aria-pressed={mano}
            title="Mano: arrastrar para mover la hoja (H, o mantén Espacio)"
          >
            ✋ Mano
          </button>
          <span className="mx-1 h-5 w-px bg-ink/25 max-md:hidden" aria-hidden />
          <button type="button" className={`${btnCls} ${verEjemplos ? "!bg-ink !text-paper" : ""}`} aria-pressed={verEjemplos} onClick={() => setVerEjemplos((v) => !v)} title="Resalta los textos y fotos que siguen siendo de ejemplo (solo se ve aquí, no en la revista)">
            ✎ Ejemplos
          </button>
          <button type="button" className={`${btnCls} max-md:hidden ${rej.reglas ? "!bg-ink !text-paper" : ""}`} aria-pressed={rej.reglas} onClick={() => setRej({ reglas: !rej.reglas })} title="Reglas: arrastra desde ellas para crear guías">
            ▭ Reglas
          </button>
          <button type="button" className={`${btnCls} max-md:hidden ${rej.cuadricula ? "!bg-ink !text-paper" : ""}`} aria-pressed={rej.cuadricula} onClick={() => setRej({ cuadricula: !rej.cuadricula })} title="Cuadrícula (Ctrl + ')">
            ▦ Cuadrícula
          </button>
          <select
            aria-label="Paso de la cuadrícula"
            title="Separación de la cuadrícula, en unidades de la hoja"
            className="font-sans h-[1.7rem] w-[4.3rem] border border-ink/40 bg-paper px-1 text-xs font-semibold max-md:hidden"
            value={rej.paso}
            onChange={(e) => setRej({ paso: Number(e.target.value) })}
          >
            {PASOS_REJILLA.map((p) => (
              <option key={p} value={p}>{p} u</option>
            ))}
          </select>
          <button type="button" className={`${btnCls} max-md:hidden ${rej.iman ? "!bg-ink !text-paper" : ""}`} aria-pressed={rej.iman} onClick={() => setRej({ iman: !rej.iman })} title="Imán a la cuadrícula: al mover o redimensionar, los bordes se acercan a sus líneas (Alt lo desactiva)">
            🧲 Imán
          </button>
          {(guiasPag.v?.length || guiasPag.h?.length) ? (
            <button type="button" className={btnCls} onClick={() => fijarGuias([], [])} title="Quitar todas las guías de esta página">
              ✕ Guías ({(guiasPag.v?.length ?? 0) + (guiasPag.h?.length ?? 0)})
            </button>
          ) : null}
          <button
            type="button"
            className={`${btnCls} ml-auto`}
            onClick={() => setCompleta((c) => !c)}
            title={completa ? "Volver al panel" : "Ampliar el espacio de trabajo a toda la pantalla (Ctrl+S sigue guardando)"}
          >
            {completa ? "✕ Salir" : "⛶ Completa"}
          </button>
        </div>

          </div>
        </div>
      </div>

      {/* Panel lateral: propiedades o vista del celular */}
      {/* Celular: botón flotante para abrir/cerrar el cajón de propiedades */}
      {movil && !cajon && !completa && (
        <button
          type="button"
          onClick={() => setCajon(true)}
          className="font-sans fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-paper shadow-lg md:hidden"
        >
          ⚙ {unico ? "Propiedades" : "Hoja y capas"}
        </button>
      )}
      <aside
        className={`min-w-0 space-y-5 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:max-h-[58vh] max-md:overflow-y-auto max-md:border-t-2 max-md:border-ink max-md:bg-paper max-md:p-3 max-md:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] xl:sticky xl:top-0 xl:max-h-[calc(var(--alto-trabajo)+6rem)] xl:self-start xl:overflow-y-auto xl:overscroll-contain xl:pr-1 ${cajon ? "" : "max-md:hidden"}`}
        aria-label="Panel lateral"
        style={{ "--alto-trabajo": altoTrabajo } as React.CSSProperties}
      >
        <div className="sticky top-0 z-10 -mx-3 -mt-3 flex items-center gap-2 border-b border-ink/30 bg-paper px-3 py-2 md:hidden">
          <span className="font-sans mr-auto text-xs font-bold uppercase tracking-wider">{unico ? "Propiedades" : seleccion.length > 1 ? `${seleccion.length} elementos` : "Hoja y capas"}</span>
          {unico?.tipo === "texto" && (
            <button type="button" className={btnCls} onClick={() => { setEditando(unico.id!); setCajon(false); }}>
              ✎ Escribir
            </button>
          )}
          <button type="button" className={btnCls} onClick={() => setCajon(false)} aria-label="Cerrar propiedades">
            ✕ Cerrar
          </button>
        </div>
        <div role="tablist" aria-label="Panel lateral" className="flex border-b-2 border-ink/30 xl:sticky xl:top-0 xl:z-10 xl:bg-paper">
          {(
            [
              ["propiedades", "Propiedades"],
              ["celular", "📱 Celular"],
            ] as const
          ).map(([id, t]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={lateral === id}
              onClick={() => setLateral(id)}
              className={`font-sans -mb-0.5 flex-1 border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-wider ${lateral === id ? "border-terracota text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {lateral === "celular" ? (
          <VistaCelular pagina={pagina} onChange={onChange} edicionId={edicionId} seleccionados={sel} onSeleccionar={setSel} />
        ) : (
          <>
        {seleccion.length > 0 && (
          <PanelAlinear
            n={seleccion.length}
            respectoHoja={respectoHoja}
            onRespectoHoja={setRespectoHoja}
            onAlinear={alinear}
            onDistribuir={distribuir}
          />
        )}

        {unico ? (
          <InspectorElemento
            el={unico}
            cambiar={cambiar}
            paginas={paginas}
            anclas={anclas}
            globoSel={globoSel}
            onGloboSel={setGloboSel}
            acciones={{
              frente: () => moverGrupo("frente"),
              atras: () => moverGrupo("atras"),
              duplicar,
              eliminar,
              ajustarAlto: unico.tipo === "texto" ? ajustarAltoTexto : undefined,
              probarAnimacion: () => reproducir([unico.id!]),
              recortar: unico.tipo === "imagen" && unico.src && !unico.comparar ? () => setRecortando(unico.id!) : undefined,
              quitarFondo: unico.tipo === "imagen" && unico.src ? () => setQuitandoFondo(unico.id!) : undefined,
              probarMovimiento: (forzar) => probarMovimiento(unico.id!, forzar),
              cambiarIcono: unico.tipo === "icono" ? () => setBiblioteca({ modo: unico.icono.startsWith("fig-") ? "figuras" : "iconos", reemplazar: true }) : undefined,
              seleccionarGrupo:
                unico.grupo && elementos.filter((e) => e.grupo === unico.grupo).length > 1
                  ? () => setSel(expandir([unico.id!]))
                  : undefined,
            }}
          />
        ) : seleccion.length > 1 ? (
          <InspectorMultiple
            n={seleccion.length}
            esGrupo={
              !!seleccion[0].grupo &&
              seleccion.every((e) => e.grupo === seleccion[0].grupo) &&
              elementos.filter((e) => e.grupo === seleccion[0].grupo).length === seleccion.length
            }
            acciones={{ frente: () => moverGrupo("frente"), atras: () => moverGrupo("atras"), duplicar, eliminar, agrupar, desagrupar }}
            onCascada={animarCascada}
          />
        ) : (
          <InspectorPagina pagina={pagina} onChange={onChange} repetidos={repetidos} onProbarTodo={() => reproducir()} />
        )}

        <Panel titulo="Capas" plegable abierto={false} resumen={`${elementos.length} elementos`} ayuda="Arriba = al frente. Mayús/Ctrl + clic selecciona varias.">
          <ol className="-m-4 max-h-72 overflow-y-auto">
                {elementos.length === 0 && <li className="font-sans p-3 text-xs italic text-ink-soft">Sin elementos.</li>}
                {[...elementos].reverse().map((el) => {
                  const activo = sel.includes(el.id!);
                  return (
                    <li key={el.id} className={`flex items-center gap-1 border-b border-ink/10 ${activo ? "bg-paper" : ""} ${el.oculto ? "opacity-50" : ""}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          if (e.shiftKey || e.ctrlKey || e.metaKey) setSel((s) => (s.includes(el.id!) ? s.filter((id) => id !== el.id) : [...s, el.id!]));
                          else setSel([el.id!]);
                        }}
                        className={`font-sans min-w-0 flex-1 truncate px-3 py-1.5 text-left text-xs ${activo ? "font-bold" : ""} ${el.oculto ? "line-through" : ""}`}
                      >
                        {el.grupo ? "⛓ " : ""}
                        {resumen(el)}
                      </button>
                      <button
                        type="button"
                        className={`${btnCls} !border-0`}
                        onClick={() => alternarCapa(el.id!, "bloqueado")}
                        aria-pressed={!!el.bloqueado}
                        aria-label={el.bloqueado ? "Desbloquear capa" : "Bloquear capa"}
                        title={el.bloqueado ? "Bloqueado: no se puede mover con el ratón. Clic para desbloquear" : "Bloquear (no se mueve por accidente)"}
                      >
                        {el.bloqueado ? "🔒" : "🔓"}
                      </button>
                      <button
                        type="button"
                        className={`${btnCls} !border-0`}
                        onClick={() => alternarCapa(el.id!, "oculto")}
                        aria-pressed={!!el.oculto}
                        aria-label={el.oculto ? "Mostrar capa" : "Ocultar capa"}
                        title={el.oculto ? "Oculto: no se ve en la página publicada. Clic para mostrar" : "Ocultar (no se ve en la página publicada)"}
                      >
                        {el.oculto ? "🚫" : "👁"}
                      </button>
                      <button type="button" className={`${btnCls} !border-0`} onClick={() => moverCapa("subir", el.id!)} aria-label="Subir capa">↑</button>
                      <button type="button" className={`${btnCls} mr-1 !border-0`} onClick={() => moverCapa("bajar", el.id!)} aria-label="Bajar capa">↓</button>
                    </li>
                  );
                })}
              </ol>
        </Panel>
          </>
        )}
      </aside>
    </div>
    </CuentagotasContext.Provider>
    </FotosPaginaContext.Provider>
    </ColoresPaginaContext.Provider>
  );
}
