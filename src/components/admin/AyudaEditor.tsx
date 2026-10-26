"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GRUPOS_AYUDA, TEMAS_AYUDA, type TemaAyuda } from "@/lib/ayuda-editor";
import { btnCls } from "./campos";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const VACIAS = new Set(["como", "una", "uno", "un", "el", "la", "los", "las", "de", "del", "que", "quiero", "hacer", "para", "puedo", "se", "lo", "mi", "mis", "en", "con", "por", "es", "me", "al", "y", "o"]);

/**
 * Panel de ayuda del editor: búsqueda en español («¿cómo subo una foto?») sobre temas cortos escritos paso a paso, con un botón
 * «Muéstrame dónde» que resalta en pantalla la pieza de la que se habla, y acceso al recorrido guiado.
 */
export default function AyudaEditor({
  inicial = "",
  onMostrar,
  onRecorrido,
  onCerrar,
}: {
  /** Texto con el que se abre la búsqueda (por ejemplo, «atajos»). */
  inicial?: string;
  /** Resalta una pieza de la pantalla (valor de data-tour) con el título del tema. */
  onMostrar: (pieza: string, titulo: string) => void;
  onRecorrido: () => void;
  onCerrar: () => void;
}) {
  const [consulta, setConsulta] = useState(inicial);
  const [abierto, setAbierto] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  useEffect(() => entrada.current?.focus(), []);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const resultados = useMemo(() => {
    const q = normalizar(consulta.trim());
    if (!q) return TEMAS_AYUDA;
    // Todas las palabras de la búsqueda deben aparecer (título, palabras clave o pasos); ignora acentos y «¿ ?».
    // Las palabras vacías no cuentan, y cada palabra se busca por su raíz («subo» encuentra «subir»).
    const palabras = q
      .replace(/[¿?¡!.,]/g, " ")
      .split(/\s+/)
      .filter((p) => p.length > 1 && !VACIAS.has(p))
      .map((p) => (p.length >= 4 ? p.slice(0, Math.max(3, p.length - 2)) : p));
    if (palabras.length === 0) return TEMAS_AYUDA;
    return TEMAS_AYUDA.filter((t) => {
      const heno = normalizar(`${t.titulo} ${t.palabras} ${t.pasos.join(" ")}`);
      return palabras.every((p) => heno.includes(p));
    });
  }, [consulta]);

  const grupos = GRUPOS_AYUDA.map((g) => [g, resultados.filter((t) => t.grupo === g)] as const).filter(([, l]) => l.length > 0);

  const tema = (t: TemaAyuda) => {
    const abiertoAhora = abierto === t.id || (consulta.trim() !== "" && resultados.length <= 3);
    return (
      <li key={t.id} className="border-b border-ink/15">
        <button type="button" aria-expanded={abiertoAhora} onClick={() => setAbierto(abiertoAhora && abierto === t.id ? null : t.id)} className="font-sans flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold hover:bg-ink/5">
          <span aria-hidden className="text-xs text-ink-soft">
            {abiertoAhora ? "▾" : "▸"}
          </span>
          {t.titulo}
        </button>
        {abiertoAhora && (
          <div className="px-4 pb-3 pl-9">
            <ol className="font-sans list-decimal space-y-1.5 pl-4 text-[0.8rem] leading-relaxed text-ink">
              {t.pasos.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
            {t.nota && <p className="font-sans mt-2 text-xs italic text-ink-soft">{t.nota}</p>}
            {t.muestra && (
              <button type="button" className={`${btnCls} mt-3`} onClick={() => onMostrar(t.muestra!, t.titulo)}>
                👆 Muéstrame dónde
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <aside role="dialog" aria-label="Ayuda" className="fixed bottom-0 right-0 top-0 z-[70] flex w-[26rem] max-w-full flex-col border-l-2 border-ink bg-paper shadow-2xl">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/30 bg-paper-deep px-4 py-3">
        <h2 className="font-display text-2xl font-black">Ayuda</h2>
        <button type="button" className={btnCls} onClick={onCerrar} aria-label="Cerrar la ayuda">
          ✕
        </button>
      </header>
      <div className="shrink-0 space-y-2 border-b border-ink/20 px-4 py-3">
        <input
          ref={entrada}
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="¿Qué quieres hacer? Ej.: subir una foto"
          aria-label="Buscar en la ayuda"
          className="w-full rounded-full border border-ink/30 bg-white/80 px-4 py-2 font-sans text-sm outline-none focus:border-terracota dark:bg-white/5"
        />
        <button type="button" className={`${btnCls} w-full !py-2`} onClick={onRecorrido}>
          ▶ Hacer el recorrido guiado
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {grupos.length === 0 ? (
          <div className="font-sans px-4 py-6 text-sm text-ink-soft">
            <p>No encontré nada para «{consulta}».</p>
            <p className="mt-2">Prueba con otra palabra (foto, texto, página, publicar, color…) o con el recorrido guiado de arriba.</p>
          </div>
        ) : (
          grupos.map(([g, lista]) => (
            <section key={g}>
              <h3 className="font-sans sticky top-0 z-10 border-b border-ink/20 bg-paper-deep px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">{g}</h3>
              <ul>{lista.map(tema)}</ul>
            </section>
          ))
        )}
        <p className="font-sans px-4 py-4 text-[0.7rem] leading-relaxed text-ink-soft">
          La guía completa, con todos los detalles, es el archivo <strong>GUIA-EDICIONES.md</strong> de la carpeta del proyecto.
        </p>
      </div>
    </aside>
  );
}
