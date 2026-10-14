"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import {
  ANCHO_LIENZO,
  COLORES,
  CATEGORIAS_FUENTE,
  ETIQUETAS_COLOR,
  FUENTES,
  FUENTES_INFO,
  colorCss,
  fuenteCss,
  type Parrafo,
} from "@/lib/esquema";
import {
  aDocumento,
  colorDesdeCss,
  desdeDocumento,
  fuenteDesdeCss,
  tamACss,
  tamDesdeCss,
} from "./textoEnriquecido";

type Caja = { l: number; t: number; r: number; b: number };

const TAMANOS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 44, 56, 72, 96, 128, 160];

const boton = (activo = false) =>
  `font-sans flex h-8 min-w-8 items-center justify-center border px-1.5 text-sm leading-none ${
    activo ? "border-terracota bg-ink text-paper" : "border-ink/30 bg-paper text-ink hover:bg-paper-deep"
  }`;

/**
 * Editor de texto con formato por selección (negrita, cursiva, subrayado, tachado, color, resaltado,
 * tipografía y tamaño). La barra de herramientas se dibuja sobre la hoja, junto a la caja que se edita.
 */
export default function EditorTexto({
  contenidoInicial,
  baseTam,
  alCambiar,
  alSalir,
  lienzo,
  caja,
  alto,
  escala,
}: {
  contenidoInicial: Parrafo[];
  /** Tamaño del texto de la caja (el de los tramos sin tamaño propio). */
  baseTam: number;
  alCambiar: (contenido: Parrafo[], textoPlano: string) => void;
  alSalir: () => void;
  /** Nodo de la hoja, donde se dibuja la barra. */
  lienzo: HTMLElement | null;
  caja: Caja;
  alto: number;
  /** Píxeles por unidad del lienzo. */
  escala: number;
}) {
  const [menu, setMenu] = useState<null | "fuente" | "color" | "fondo">(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: false,
      }),
      TextStyleKit.configure({ lineHeight: false }),
    ],
    content: aDocumento(contenidoInicial),
    autofocus: "end",
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "outline-none" },
      handleKeyDown: (_vista, ev) => {
        if (ev.key === "Escape") {
          alSalir();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      alCambiar(desdeDocumento(ed.getJSON()), ed.getText({ blockSeparator: "\n" }));
    },
  });

  const estado = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            negrita: ed.isActive("bold"),
            cursiva: ed.isActive("italic"),
            subrayado: ed.isActive("underline"),
            tachado: ed.isActive("strike"),
            ...ed.getAttributes("textStyle"),
          }
        : null,
  }) as null | {
    negrita: boolean;
    cursiva: boolean;
    subrayado: boolean;
    tachado: boolean;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontSize?: string;
  };

  if (!editor) return null;

  const cmd = () => editor.chain().focus();
  const tam = tamDesdeCss(estado?.fontSize) ?? baseTam;
  const fuenteActual = fuenteDesdeCss(estado?.fontFamily);
  const colorActual = colorDesdeCss(estado?.color);
  const fondoActual = colorDesdeCss(estado?.backgroundColor);

  // La barra va encima de la caja; si no cabe arriba, debajo.
  const arriba = caja.t * escala > 56;
  const barra = (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="absolute z-30 flex flex-wrap items-center gap-1 border border-ink bg-paper p-1.5 shadow-lg"
      style={{
        left: `${Math.min(Math.max(0, (caja.l / ANCHO_LIENZO) * 100), 40)}%`,
        top: arriba ? `calc(${(caja.t / alto) * 100}% - 50px)` : `calc(${(caja.b / alto) * 100}% + 8px)`,
        width: "max-content",
        maxWidth: "94%",
        userSelect: "none",
        cursor: "default",
      }}
    >
      {/* Tipografía */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMenu(menu === "fuente" ? null : "fuente")}
          className={`${boton(menu === "fuente")} w-40 justify-between gap-2 !px-2`}
          title="Tipografía de la selección"
        >
          <span className="truncate" style={{ fontFamily: fuenteCss(fuenteActual) }}>
            {fuenteActual ? FUENTES_INFO[fuenteActual].nombre : "Predeterminada"}
          </span>
          <span aria-hidden>▾</span>
        </button>
        {menu === "fuente" && (
          <div className="absolute left-0 top-9 z-40 max-h-72 w-60 overflow-y-auto border border-ink bg-paper shadow-lg">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                cmd().unsetFontFamily().run();
                setMenu(null);
              }}
              className="font-sans block w-full border-b border-ink/15 px-3 py-1.5 text-left text-xs italic hover:bg-paper-deep"
            >
              Predeterminada de la caja
            </button>
            {CATEGORIAS_FUENTE.map((cat) => (
              <div key={cat}>
                <p className="font-sans bg-paper-deep px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">{cat}</p>
                {FUENTES.filter((f) => FUENTES_INFO[f].categoria === cat).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      cmd().setFontFamily(fuenteCss(f)).run();
                      setMenu(null);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-lg leading-tight hover:bg-paper-deep ${fuenteActual === f ? "bg-paper-deep font-bold" : ""}`}
                    style={{ fontFamily: fuenteCss(f) }}
                  >
                    {FUENTES_INFO[f].nombre}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tamaño */}
      <button type="button" className={boton()} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd().setFontSize(tamACss(Math.max(4, Math.round(tam - 2)))).run()} title="Reducir tamaño">−</button>
      <select
        aria-label="Tamaño"
        value={TAMANOS.includes(Math.round(tam)) ? Math.round(tam) : ""}
        onChange={(e) => e.target.value && cmd().setFontSize(tamACss(Number(e.target.value))).run()}
        className="font-sans h-8 w-16 border border-ink/30 bg-paper px-1 text-sm"
      >
        {!TAMANOS.includes(Math.round(tam)) && <option value="">{Math.round(tam)}</option>}
        {TAMANOS.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button type="button" className={boton()} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd().setFontSize(tamACss(Math.round(tam + 2))).run()} title="Aumentar tamaño">+</button>

      <span className="mx-0.5 h-6 w-px bg-ink/25" />

      <button type="button" className={`${boton(!!estado?.negrita)} font-bold`} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd().toggleBold().run()} title="Negrita (Ctrl+B)">B</button>
      <button type="button" className={`${boton(!!estado?.cursiva)} italic`} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd().toggleItalic().run()} title="Cursiva (Ctrl+I)">I</button>
      <button type="button" className={`${boton(!!estado?.subrayado)} underline`} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd().toggleUnderline().run()} title="Subrayado (Ctrl+U)">U</button>
      <button type="button" className={`${boton(!!estado?.tachado)} line-through`} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd().toggleStrike().run()} title="Tachado">S</button>

      <span className="mx-0.5 h-6 w-px bg-ink/25" />

      {/* Color del texto y resaltado */}
      {(["color", "fondo"] as const).map((cual) => {
        const actual = cual === "color" ? colorActual : fondoActual;
        const aplicar = (c: string | null) => {
          if (cual === "color") (c ? cmd().setColor(colorCss(c, "")) : cmd().unsetColor()).run();
          else (c ? cmd().setBackgroundColor(colorCss(c, "")) : cmd().unsetBackgroundColor()).run();
        };
        return (
          <div key={cual} className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setMenu(menu === cual ? null : cual)}
              className={`${boton(menu === cual)} flex-col gap-0.5 !px-2`}
              title={cual === "color" ? "Color del texto" : "Resaltado"}
            >
              <span className={cual === "color" ? "font-bold" : "bg-ocre/60 px-0.5 font-bold"}>A</span>
              <span className="h-0.5 w-4" style={{ background: actual ? colorCss(actual, "#000") : "transparent", outline: actual ? undefined : "1px solid rgba(0,0,0,.3)" }} />
            </button>
            {menu === cual && (
              <div className="absolute left-0 top-9 z-40 w-56 border border-ink bg-paper p-2 shadow-lg">
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" title="Quitar" aria-label="Quitar" onMouseDown={(e) => e.preventDefault()} onClick={() => { aplicar(null); setMenu(null); }} className="h-6 w-6 border border-ink/40 text-[0.6rem]">∅</button>
                  {COLORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={ETIQUETAS_COLOR[c]}
                      aria-label={ETIQUETAS_COLOR[c]}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { aplicar(c); setMenu(null); }}
                      style={{ background: colorCss(c, "#000") }}
                      className={`h-6 w-6 border ${actual === c ? "border-terracota ring-2 ring-terracota" : "border-ink/40"}`}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label="Color libre"
                    defaultValue={actual && actual.startsWith("#") ? actual : "#068562"}
                    onChange={(e) => aplicar(e.target.value)}
                    className="h-6 w-8 cursor-pointer border border-ink/40 bg-transparent p-0"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" className={boton()} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd().unsetAllMarks().run()} title="Quitar todo el formato de la selección">⌫ Formato</button>
      <button type="button" className={`${boton()} bg-ink !text-paper`} onMouseDown={(e) => e.preventDefault()} onClick={alSalir} title="Terminar (Esc)">Listo</button>
    </div>
  );

  return (
    <>
      <EditorContent editor={editor} />
      {lienzo ? createPortal(barra, lienzo) : null}
    </>
  );
}
