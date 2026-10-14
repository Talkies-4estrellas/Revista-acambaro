import Link from "next/link";
import type { CSSProperties } from "react";
import EnlaceMedido from "@/components/EnlaceMedido";
import {
  ANCHO_LIENZO,
  ALTO_LIENZO,
  colorCss,
  estiloMolde,
  fuenteCss,
  type Elemento,
  type ElementoForma,
  type Parrafo,
  type Tramo,
} from "@/lib/esquema";
import { createElement } from "react";
import { ICONOS } from "@/lib/iconos-datos";
import { Inline, Video } from "./Bloques";
import Placeholder from "./Placeholder";

/**
 * Dibujo de una página "lienzo". Lo usan el sitio y el editor, para que lo que se ve al
 * componer sea exactamente lo que se publica. Todas las medidas son unidades del lienzo
 * (800 de ancho) convertidas a `cqw`, así la hoja escala con su contenedor.
 */

const cqu = (n: number, base: number) => `${(n / base) * 100}cqw`;
const cq = (n: number) => cqu(n, ANCHO_LIENZO);

/**
 * En la columna del celular los titulares muy grandes se comprimen: un título de 100 unidades en una hoja de 800 cabe
 * en una línea, pero en la columna (520) se partiría. Hasta 48 unidades no cambia; lo que pasa de ahí se reduce a menos
 * de la mitad del exceso.
 */
const tamMovil = (t: number) => (t <= 48 ? t : 48 + (t - 48) * 0.45);
/**
 * Piso de legibilidad en la columna del celular: con ~375 px de pantalla, 15.5 unidades son unos 11 px. Los textos más
 * chicos (pies de foto, créditos) se igualan a ese mínimo; en la hoja de escritorio no cambian.
 */
const TAM_MIN_MOVIL = 15.5;
const tamBase = (t: number, base: number) => (base === ANCHO_LIENZO ? t : Math.max(tamMovil(t), TAM_MIN_MOVIL));

/** Estilo CSS de un tramo de texto con formato. */
function estiloTramo(t: Tramo, base = ANCHO_LIENZO): CSSProperties {
  const decoracion = [t.subrayado && "underline", t.tachado && "line-through"].filter(Boolean).join(" ");
  return {
    fontWeight: t.negrita ? "bolder" : undefined,
    fontStyle: t.cursiva ? "italic" : undefined,
    textDecoration: decoracion || undefined,
    color: t.color ? colorCss(t.color, "inherit") : undefined,
    background: t.fondo ? colorCss(t.fondo, "transparent") : undefined,
    fontFamily: t.fuente ? fuenteCss(t.fuente) : undefined,
    fontSize: t.tam ? cqu(tamBase(t.tam, base), base) : undefined,
  };
}

/** Párrafos con estilos por tramo. Las líneas vacías conservan su altura. */
export function ParrafosVista({ contenido, base = ANCHO_LIENZO }: { contenido: Parrafo[]; base?: number }) {
  return (
    <>
      {contenido.map((p, i) => (
        <div key={i} style={{ whiteSpace: "pre-wrap", minHeight: "1em" }}>
          {p.length === 0 ? (
            <br />
          ) : (
            p.map((t, j) => (
              <span key={j} style={estiloTramo(t, base)}>
                {t.texto}
              </span>
            ))
          )}
        </div>
      ))}
    </>
  );
}

const ALINEAR = { izquierda: "left", centro: "center", derecha: "right", justificado: "justify" } as const;
const VERTICAL = { arriba: "flex-start", centro: "center", abajo: "flex-end" } as const;

/** Icono del catálogo dibujado como SVG que llena su caja. */
export function IconoSvg({
  icono,
  color,
  trazo,
  alt,
  className,
}: {
  icono: string;
  color?: string;
  trazo?: number;
  alt?: string;
  className?: string;
}) {
  const d = ICONOS[icono];
  const estilo: CSSProperties = { display: "block", width: "100%", height: "100%", color: colorCss(color, "var(--ink)") };
  if (!d)
    return (
      <div className={className} style={{ ...estilo, border: "1px dashed currentColor", fontSize: cq(12) }}>
        ?
      </div>
    );
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={alt ?? d.nombre}
      className={className}
      style={estilo}
      {...(d.estilo === "trazo"
        ? { fill: "none", stroke: "currentColor", strokeWidth: trazo ?? 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
        : { fill: "currentColor" })}
    >
      {d.nodos.map(([etiqueta, atributos], i) => createElement(etiqueta, { key: i, ...atributos }))}
    </svg>
  );
}

export type PropsEdicion = {
  seleccionado?: boolean;
  /** Texto en edición directa. */
  editando?: boolean;
  /** Editor de texto enriquecido que sustituye al texto mientras se edita. */
  contenidoEdicion?: React.ReactNode;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: () => void;
  /** Por ejemplo, los tiradores de redimensionado. */
  children?: React.ReactNode;
};

/** Cómo se coloca un elemento en la columna del celular (ver LienzoApilado). */
export type Apilado = {
  /** Ancho como porcentaje de la columna. */
  ancho: number;
  alinear: "start" | "center" | "end";
  /** Separación con el elemento anterior, en unidades de la columna. */
  margenSuperior: number;
  /** Altura fija (líneas finas); si no, el texto crece solo y lo demás conserva su proporción. */
  altoFijo?: number;
};

export function ElementoVista({
  el,
  edicionId,
  editor,
  animar = false,
  base = ANCHO_LIENZO,
  apilado,
  miniatura = false,
}: {
  el: Elemento;
  edicionId?: string;
  editor?: PropsEdicion;
  /** Sitio publicado: el elemento arranca oculto y AnimacionesLienzo lo anima al entrar en pantalla. */
  animar?: boolean;
  /** Ancho (en unidades) al que se refieren las medidas: 800 en la hoja, 520 en la columna del celular. */
  base?: number;
  /** Colocación en columna (celular); sin esto el elemento va en su posición libre de la hoja. */
  apilado?: Apilado;
  /** Miniatura: los videos (y sus reproductores) se sustituyen por un marcador para no cargarlos. */
  miniatura?: boolean;
}) {
  const cq = (n: number) => cqu(n, base);
  const caja: CSSProperties = apilado
    ? {
        position: "relative",
        width: `${apilado.ancho}%`,
        alignSelf: apilado.alinear,
        marginTop: cq(apilado.margenSuperior),
        opacity: el.opacidad,
        boxSizing: "border-box",
        ...(el.tipo === "texto"
          ? {}
          : apilado.altoFijo !== undefined
            ? { height: cq(apilado.altoFijo) }
            : { aspectRatio: `${el.w} / ${el.h}` }),
      }
    : {
        position: "absolute",
        left: cq(el.x),
        top: cq(el.y),
        width: cq(el.w),
        height: cq(el.h),
        transform: el.rot ? `rotate(${el.rot}deg)` : undefined,
        opacity: el.opacidad,
        boxSizing: "border-box",
      };

  let contenido: React.ReactNode = null;

  if (el.tipo === "texto") {
    const estilo: CSSProperties = {
      width: "100%",
      height: apilado ? "auto" : "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: VERTICAL[el.vertical ?? "arriba"],
      fontFamily: fuenteCss(el.fuente),
      fontSize: cq(tamBase(el.tam ?? 24, base)),
      fontWeight: el.peso ?? 400,
      fontStyle: el.cursiva ? "italic" : "normal",
      color: colorCss(el.color, "var(--ink)"),
      textAlign: ALINEAR[el.alinear ?? "izquierda"],
      lineHeight: el.interlineado ?? 1.3,
      letterSpacing: el.espaciado ? `${el.espaciado}em` : undefined,
      textTransform: el.mayusculas ? "uppercase" : undefined,
      background: el.fondo ? colorCss(el.fondo, "transparent") : undefined,
      padding: el.relleno ? cq(el.relleno) : undefined,
      boxSizing: "border-box",
      overflowWrap: "break-word",
    };
    contenido =
      editor?.editando && editor.contenidoEdicion ? (
        <div
          style={{
            ...estilo,
            background: el.fondo ? colorCss(el.fondo, "transparent") : "rgba(255,255,255,.55)",
            userSelect: "text",
            cursor: "text",
          }}
        >
          <div className="lienzo-editor" style={{ width: "100%" }} data-texto>
            {editor.contenidoEdicion}
          </div>
        </div>
      ) : (
        <div style={estilo}>
          <div style={{ whiteSpace: "pre-wrap" }} data-texto>
            {el.contenido ? <ParrafosVista contenido={el.contenido} base={base} /> : <Inline text={el.texto} />}
          </div>
        </div>
      );
  } else if (el.tipo === "imagen") {
    const radio = el.radio ? cq(el.radio) : undefined;
    contenido = (
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: el.molde ? undefined : radio, ...estiloMolde(el.molde) }}>
        {el.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={el.src}
            alt={el.alt ?? ""}
            draggable={false}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: el.ajuste === "contener" ? "contain" : "cover", display: "block" }}
          />
        ) : (
          <Placeholder tone={el.tono ?? "ocre"} label={el.alt ?? "Imagen"} showLabel={false} className="h-full w-full" />
        )}
      </div>
    );
  } else if (el.tipo === "video") {
    const radio = el.radio ? cq(el.radio) : undefined;
    const sinVideo = !el.src && !el.youtube && !el.vimeo;
    contenido = (
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: el.molde ? undefined : radio, background: "var(--ink)", ...estiloMolde(el.molde) }}>
        {editor || sinVideo || miniatura ? (
          <div
            style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--paper)" }}
          >
            <span style={{ fontFamily: "var(--font-sans)", fontSize: cq(20), letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ▶ {sinVideo ? "Video pendiente" : "Video"}
            </span>
          </div>
        ) : (
          <Video v={el} className="aspect-auto! h-full w-full!" />
        )}
      </div>
    );
  } else if (el.tipo === "icono") {
    contenido = <IconoSvg icono={el.icono} color={el.color} trazo={el.trazo} alt={el.alt} />;
  } else {
    contenido = (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: colorCss(el.color, "var(--ink)"),
          borderRadius: el.molde ? undefined : el.forma === "elipse" ? "50%" : el.radio ? cq(el.radio) : undefined,
          border: el.borde && !el.molde ? `${cq(el.borde)} solid ${colorCss(el.colorBorde, "var(--ink)")}` : undefined,
          boxSizing: "border-box",
          ...estiloMolde(el.molde),
        }}
      />
    );
  }

  const marca: CSSProperties = editor
    ? { outline: editor.seleccionado ? "2px solid #068562" : undefined, cursor: editor.editando ? "text" : "move", touchAction: "none" }
    : {};

  const interior = (
    <>
      {contenido}
      {editor?.children}
    </>
  );

  if (editor) {
    return (
      <div
        data-elid={el.id}
        style={{ ...caja, ...marca }}
        onPointerDown={editor.onPointerDown}
        onDoubleClick={editor.onDoubleClick}
      >
        {interior}
      </div>
    );
  }

  // Con animación de entrada, el contenido va en un envoltorio que arranca invisible; el cliente lo anima al verse.
  // (El envoltorio es independiente de la caja, que ya lleva el giro y la opacidad del elemento.)
  const animado =
    animar && el.animacion ? (
      <div
        data-anim={el.animacion.efecto}
        data-dur={el.animacion.duracion}
        data-ret={el.animacion.retraso}
        style={{ width: "100%", height: "100%", opacity: 0 }}
      >
        {contenido}
      </div>
    ) : (
      contenido
    );

  // En el sitio: el elemento puede ser un enlace a otra página o a una dirección externa.
  // En miniaturas no hay enlaces: la miniatura suele ir dentro de otro enlace y un <a> dentro de un <a> es HTML inválido.
  if (el.enlace !== undefined && edicionId && !miniatura) {
    const externo = typeof el.enlace === "string" && !el.enlace.startsWith("/");
    const href = typeof el.enlace === "string" ? el.enlace : `/ediciones/${edicionId}/${el.enlace}`;
    const props = externo ? { target: "_blank", rel: "noopener noreferrer" } : {};
    // Los enlaces externos con id se cuentan (ver lib/clics.ts); el resto se comporta como antes.
    if (externo && el.id && !editor)
      return (
        <EnlaceMedido href={href} edicion={edicionId} elemento={el.id} style={{ ...caja, display: "block", color: "inherit", textDecoration: "none" }}>
          {animado}
        </EnlaceMedido>
      );
    return (
      <Link href={href} {...props} style={{ ...caja, display: "block", color: "inherit", textDecoration: "none" }}>
        {animado}
      </Link>
    );
  }
  return <div style={caja}>{animado}</div>;
}

export default function LienzoVista({
  elementos,
  fondo,
  alto = ALTO_LIENZO,
  edicionId,
  animar = false,
  className = "",
  miniatura = false,
}: {
  elementos: Elemento[];
  fondo?: string;
  alto?: number;
  edicionId: string;
  /** Activa las animaciones de entrada (solo en las páginas publicadas, no en miniaturas). */
  animar?: boolean;
  className?: string;
  /** Para miniaturas: no se cargan reproductores de video. */
  miniatura?: boolean;
}) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[900px] overflow-hidden ${className}`}
      style={{
        containerType: "inline-size",
        aspectRatio: `${ANCHO_LIENZO} / ${alto}`,
        background: colorCss(fondo, "var(--paper)"),
      }}
    >
      {elementos.map((el, i) => (
        <ElementoVista key={el.id ?? i} el={el} edicionId={edicionId} animar={animar} miniatura={miniatura} />
      ))}
    </div>
  );
}


/* ----------------------------- Celular -------------------------------- */

/** Ancho virtual de la columna del celular: con 360 px de pantalla, un texto de 24 unidades mide unos 17 px. */
export const ANCHO_MOVIL = 520;
const MARGEN_MOVIL = 26;

/** Formas gruesas (rectángulos, círculos…): en la hoja suelen ser fondos o adornos de lo que tienen encima. */
const esFondo = (e: Elemento): e is ElementoForma => e.tipo === "forma" && Math.min(e.w, e.h) > 14 && e.movil === undefined;

/** Un bloque de la columna del celular: un elemento suelto o una sección (forma de fondo con sus elementos). */
export type BloqueMovil =
  | { tipo: "el"; el: Elemento; y: number; fin: number; x: number }
  | { tipo: "sec"; forma: ElementoForma; hijos: Elemento[]; y: number; fin: number; x: number };

/**
 * Decide qué bloques tiene la columna del celular y en qué orden. Por defecto el orden sale de la posición en la hoja
 * (de arriba abajo y de izquierda a derecha); con `orden` (ids) se respeta ese orden y lo que no aparezca en la lista va
 * al final, por su posición. Las formas gruesas que tenían elementos encima se convierten en secciones (el bloque se
 * ordena por la forma y sus elementos entre sí); las que no tienen nada encima se omiten; `movil: "ocultar"` oculta.
 * Lo comparte el sitio, la vista previa y el panel de orden.
 */
export function bloquesMovil(elementos: Elemento[], orden: string[] = []): BloqueMovil[] {
  const rango = new Map(orden.map((id, i) => [id, i]));
  const rangoDe = (e: Elemento) => (e.id !== undefined && rango.has(e.id) ? rango.get(e.id)! : Infinity);
  const natural = (p: { y: number; x: number }, q: { y: number; x: number }) => p.y - q.y || p.x - q.x;

  const fondos = elementos.filter(esFondo);
  // Las barras verticales finas (adornos al lado de un texto) no tienen sentido en una columna: se omiten salvo que
  // se pida "mostrar". Una regla horizontal sí se conserva como separador.
  const barraVertical = (e: Elemento) => e.tipo === "forma" && e.w <= 14 && e.h >= e.w * 2 && e.movil !== "mostrar";
  const resto = elementos.filter((e) => !esFondo(e) && e.movil !== "ocultar" && !barraVertical(e));

  // Cada elemento pertenece a la forma más pequeña que contenga su centro.
  const dueño = new Map<Elemento, ElementoForma>();
  for (const e of resto) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const dentro = fondos.filter((f) => cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h);
    if (dentro.length) {
      dentro.sort((p, q) => p.w * p.h - q.w * q.h);
      dueño.set(e, dentro[0]);
    }
  }

  const bloques: BloqueMovil[] = [];
  for (const f of fondos) {
    const hijos = resto.filter((e) => dueño.get(e) === f).sort((p, q) => rangoDe(p) - rangoDe(q) || natural(p, q));
    if (hijos.length) bloques.push({ tipo: "sec", forma: f, hijos, y: f.y, fin: f.y + f.h, x: f.x });
  }
  for (const e of resto) if (!dueño.has(e)) bloques.push({ tipo: "el", el: e, y: e.y, fin: e.y + e.h, x: e.x });
  const cabeza = (b: BloqueMovil) => rangoDe(b.tipo === "el" ? b.el : b.forma);
  return bloques.sort((p, q) => cabeza(p) - cabeza(q) || natural(p, q));
}

/**
 * Versión de una página para pantallas estrechas: los elementos se apilan en una columna (ver `bloquesMovil` para el
 * orden). El texto ocupa todo el ancho y crece según lo necesite; las imágenes conservan su proporción; la alineación
 * (izquierda, centro, derecha) sale de dónde estaban en la hoja; los titulares muy grandes se comprimen. Las secciones
 * agrupan sus elementos sobre el color de la forma, y un banner de ancho completo ocupa todo el ancho de la pantalla.
 */
export function LienzoApilado({
  elementos,
  fondo,
  edicionId,
  animar = false,
  orden,
}: {
  elementos: Elemento[];
  fondo?: string;
  edicionId: string;
  animar?: boolean;
  orden?: string[];
}) {
  const items = bloquesMovil(elementos, orden);
  const personalizado = !!orden && orden.length > 0;
  const rango = new Map((orden ?? []).map((id, i) => [id, i]));

  /** Colocación de un elemento en la columna (o dentro de una sección). */
  const colocar = (el: Elemento, hueco: number, primero: boolean): Apilado => {
    const rel = el.w / ANCHO_LIENZO;
    const centro = (el.x + el.w / 2) / ANCHO_LIENZO;
    const linea = el.tipo === "forma" && el.h <= 14;
    return {
      ancho: el.tipo === "texto" || rel >= 0.6 || (linea && rel >= 0.3) ? 100 : Math.min(100, Math.max(18, rel * 170)),
      alinear: centro < 0.38 ? "start" : centro > 0.62 ? "end" : "center",
      margenSuperior: primero ? 0 : Math.min(56, Math.max(14, hueco * 0.55)),
      altoFijo: linea ? Math.max(2, el.h) : undefined,
    };
  };
  /** Apila los elementos de una sección, ya ordenados, con los huecos que tenían entre sí. */
  const apilar = (lista: Elemento[]) => {
    let fin = 0;
    return lista.map((el, i) => {
      const hueco = i === 0 ? 0 : Math.max(0, el.y - fin);
      fin = personalizado ? el.y + el.h : Math.max(fin, el.y + el.h);
      return (
        <ElementoVista key={el.id ?? i} el={el} edicionId={edicionId} animar={animar} base={ANCHO_MOVIL} apilado={colocar(el, hueco, i === 0)} />
      );
    });
  };
  void rango;

  let finPrevio = 0;
  const bloques = items.map((it, i) => {
    const hueco = i === 0 ? 0 : Math.max(0, it.y - finPrevio);
    // Con orden manual los bloques ya no siguen la hoja: el hueco se mide contra el bloque anterior de la columna.
    finPrevio = personalizado ? it.fin : Math.max(finPrevio, it.fin);
    const margen = i === 0 ? 0 : Math.min(56, Math.max(14, hueco * 0.55));
    if (it.tipo === "el") {
      return (
        <ElementoVista
          key={it.el.id ?? i}
          el={it.el}
          edicionId={edicionId}
          animar={animar}
          base={ANCHO_MOVIL}
          apilado={colocar(it.el, hueco, i === 0)}
        />
      );
    }
    const f = it.forma;
    // Un banner que ocupaba todo el ancho de la hoja también ocupa todo el ancho de la pantalla.
    const sangrado = f.x <= 12 && f.w >= ANCHO_LIENZO - 24;
    const lado = cqu(sangrado ? MARGEN_MOVIL : 20, ANCHO_MOVIL);
    return (
      <div
        key={f.id ?? `s${i}`}
        style={{
          marginTop: cqu(margen, ANCHO_MOVIL),
          marginLeft: sangrado ? `-${cqu(MARGEN_MOVIL, ANCHO_MOVIL)}` : undefined,
          marginRight: sangrado ? `-${cqu(MARGEN_MOVIL, ANCHO_MOVIL)}` : undefined,
          background: colorCss(f.color, "var(--ink)"),
          opacity: f.opacidad,
          borderRadius: f.forma === "elipse" ? cqu(44, ANCHO_MOVIL) : f.radio ? cqu(f.radio, ANCHO_MOVIL) : undefined,
          display: "flex",
          flexDirection: "column",
          padding: `${cqu(24, ANCHO_MOVIL)} ${lado} ${cqu(28, ANCHO_MOVIL)}`,
          boxSizing: "border-box",
        }}
      >
        {apilar(it.hijos)}
      </div>
    );
  });
  return (
    <div className="lienzo-movil" style={{ containerType: "inline-size", background: colorCss(fondo, "var(--paper)"), overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: `${cqu(MARGEN_MOVIL, ANCHO_MOVIL)} ${cqu(MARGEN_MOVIL, ANCHO_MOVIL)} ${cqu(56, ANCHO_MOVIL)}`,
        }}
      >
        {bloques}
      </div>
    </div>
  );
}

/**
 * Una página lienzo con sus dos diseños. Con `movil: "apilar"`, cuando el contenedor mide 640 px o menos se muestra la
 * columna en lugar de la hoja reducida (las reglas están en globals.css). Se decide por el ancho del contenedor, no
 * del navegador, así la vista previa del panel se comporta igual que un celular real.
 */
export function LienzoResponsivo({
  elementos,
  fondo,
  alto,
  movil,
  ordenMovil,
  edicionId,
  animar = false,
}: {
  elementos: Elemento[];
  fondo?: string;
  alto?: number;
  movil?: "escala" | "apilar";
  /** Orden manual de la columna del celular (ids de elementos). */
  ordenMovil?: string[];
  edicionId: string;
  animar?: boolean;
}) {
  const apilar = movil === "apilar";
  return (
    <div className="pagina-lienzo">
      <LienzoVista
        elementos={elementos}
        fondo={fondo}
        alto={alto}
        edicionId={edicionId}
        animar={animar}
        className={apilar ? "lienzo-escritorio con-movil" : ""}
      />
      {apilar && <LienzoApilado elementos={elementos} fondo={fondo} edicionId={edicionId} animar={animar} orden={ordenMovil} />}
    </div>
  );
}
