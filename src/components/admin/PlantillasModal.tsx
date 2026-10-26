"use client";

import { useCallback, useEffect, useState } from "react";
import LienzoVista from "@/components/Lienzo";
import { PLANTILLAS_BASE } from "@/lib/plantillas-base";
import { PLANTILLAS_ANUNCIO } from "@/lib/plantillas-anuncio";
import { PLANTILLAS_COLLAGE, PLANTILLAS_EDITORIAL } from "@/lib/plantillas-editorial";
import { ETIQUETAS_PLANTILLA, limpiar, type Pagina } from "@/lib/esquema";
import { btnCls, inputCls } from "./campos";

type Guardada = { id: string; nombre: string; creada: string; pagina: Pagina };

export type ModoAplicar = "nueva" | "reemplazar";

/** Miniatura en vivo de una página: el lienzo escala solo con el ancho de su caja. */
function Miniatura({ pagina }: { pagina: Pagina }) {
  if (pagina.plantilla === "lienzo") {
    return (
      <div className="pointer-events-none border border-ink/25 shadow-sm">
        <LienzoVista elementos={pagina.elementos ?? []} fondo={pagina.fondo} alto={pagina.alto} edicionId="plantilla" miniatura />
      </div>
    );
  }
  return (
    <div className="font-sans flex aspect-[800/1100] items-center justify-center border border-ink/25 bg-paper-deep text-center text-xs font-bold uppercase tracking-wider text-ink-soft">
      {ETIQUETAS_PLANTILLA[pagina.plantilla]}
    </div>
  );
}

/**
 * Plantillas de página: guardar la página actual como plantilla y reutilizar las iniciales o las propias.
 * Las propias viven en content/plantillas y se comparten entre todas las ediciones.
 */
export default function PlantillasModal({
  paginaActual,
  numeroPagina,
  onAplicar,
  onCerrar,
  variante = "modal",
}: {
  paginaActual: Pagina;
  numeroPagina: number;
  onAplicar: (pagina: Pagina, nombre: string, modo: ModoAplicar) => void;
  onCerrar: () => void;
  /** «panel»: columna del editor junto a la hoja; «modal»: ventana (páginas clásicas, sin hoja de lienzo). */
  variante?: "modal" | "panel";
}) {
  const panel = variante === "panel";
  // En el panel lateral, «guardar como plantilla» va plegado para que las plantillas se vean primero.
  const [verGuardar, setVerGuardar] = useState(!panel);
  const [pestana, setPestana] = useState<"iniciales" | "anuncios" | "editorial" | "propias">("iniciales");
  const [guardadas, setGuardadas] = useState<Guardada[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState<{ tipo: "ok" | "error" | "cargando"; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plantillas");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setGuardadas(json.plantillas);
    } catch (e) {
      setGuardadas([]);
      setEstado({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudieron cargar las plantillas" });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar, panel]);

  async function llamar(url: string, init: RequestInit) {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
    return json;
  }

  async function guardarActual() {
    setEstado({ tipo: "cargando", texto: "Guardando plantilla…" });
    try {
      await llamar("/api/admin/plantillas", { method: "POST", body: JSON.stringify({ nombre, pagina: limpiar(paginaActual) }) });
      setNombre("");
      setEstado({ tipo: "ok", texto: "Plantilla guardada. Ya está en “Mis plantillas”." });
      await cargar();
      setPestana("propias");
    } catch (e) {
      setEstado({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo guardar" });
    }
  }

  async function renombrar(p: Guardada) {
    const n = window.prompt("Nuevo nombre de la plantilla:", p.nombre);
    if (!n || n === p.nombre) return;
    try {
      await llamar(`/api/admin/plantillas/${p.id}`, { method: "PUT", body: JSON.stringify({ nombre: n }) });
      await cargar();
    } catch (e) {
      setEstado({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo renombrar" });
    }
  }

  async function borrar(p: Guardada) {
    if (!window.confirm(`¿Eliminar la plantilla “${p.nombre}”? Las ediciones que ya la usaron no cambian.`)) return;
    try {
      await llamar(`/api/admin/plantillas/${p.id}`, { method: "DELETE" });
      await cargar();
    } catch (e) {
      setEstado({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo eliminar" });
    }
  }

  const tarjeta = (id: string, titulo: string, detalle: string, pagina: Pagina, acciones?: React.ReactNode) =>
    panel ? (
      <li key={id} className="flex flex-col gap-1 border border-ink/25 bg-white/60 p-1.5 dark:bg-white/5">
        <button type="button" className="block w-full text-left hover:opacity-85" onClick={() => onAplicar(pagina, titulo, "nueva")} title={`${titulo}: ${detalle}\n\nClic para agregarla como página nueva`} aria-label={`Agregar «${titulo}» como página nueva`}>
          <Miniatura pagina={pagina} />
        </button>
        <p className="font-sans truncate text-[0.72rem] font-bold" title={titulo}>{titulo}</p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={`${btnCls} !px-2 !text-[0.68rem]`}
            onClick={() => {
              if (window.confirm(`Esto reemplaza el contenido de la página ${numeroPagina} por esta plantilla. ¿Continuar? (Se puede deshacer cerrando sin guardar.)`)) onAplicar(pagina, titulo, "reemplazar");
            }}
            title="Reemplaza el contenido de la página actual"
          >
            Usar aquí
          </button>
          {acciones}
        </div>
      </li>
    ) : (
    <li key={id} className="flex flex-col gap-2 border border-ink/25 bg-white/60 dark:bg-white/5 p-2.5">
      <Miniatura pagina={pagina} />
      <div className="min-w-0">
        <p className="font-sans truncate text-sm font-bold" title={titulo}>{titulo}</p>
        <p className="font-sans line-clamp-2 min-h-[2rem] text-[0.7rem] text-ink-soft">{detalle}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-1">
        <button type="button" className={`${btnCls} !bg-ink !text-paper hover:!bg-terracota`} onClick={() => onAplicar(pagina, titulo, "nueva")}>
          Agregar como página nueva
        </button>
        <button
          type="button"
          className={btnCls}
          onClick={() => {
            if (window.confirm(`Esto reemplaza el contenido de la página ${numeroPagina} por esta plantilla. ¿Continuar? (Se puede deshacer cerrando sin guardar.)`))
              onAplicar(pagina, titulo, "reemplazar");
          }}
        >
          Usar en esta página
        </button>
        {acciones}
      </div>
    </li>
    );

  const pest = (id: "iniciales" | "anuncios" | "editorial" | "propias", texto: string) => (
    <button
      type="button"
      onClick={() => setPestana(id)}
      aria-pressed={pestana === id}
      className={`${btnCls} ${panel ? "!rounded-full !px-2.5" : ""} ${pestana === id ? "!bg-ink !text-paper" : ""}`}
    >
      {texto}
    </button>
  );

  const contenido = (
    <>
        {/* Guardar la página actual */}
        <section className={panel ? "border-b border-ink/20 px-3 py-3" : "border-b border-ink/20 px-5 py-4"}>
          {panel ? (
            <button type="button" className="font-sans flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider" aria-expanded={verGuardar} onClick={() => setVerGuardar((v) => !v)}>
              <span>☆ Guardar la página {numeroPagina} como plantilla</span>
              <span aria-hidden>{verGuardar ? "▾" : "▸"}</span>
            </button>
          ) : (
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider">Guardar la página {numeroPagina} como plantilla</h3>
          )}
          {verGuardar && (
            <>
          <p className="font-sans mt-1 text-[0.72rem] text-ink-soft">
            Se guarda con su diseño (y se copian sus imágenes) para reutilizarla en cualquier edición. Los enlaces a otras páginas de esta edición no se conservan.
          </p>
          <form
            className="mt-2 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              guardarActual();
            }}
          >
            <input className={`${inputCls} max-w-sm`} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la plantilla, p. ej. Entrevista a dos columnas" maxLength={60} aria-label="Nombre de la plantilla" />
            <button type="submit" className={`${btnCls} !px-4`} disabled={!nombre.trim() || estado?.tipo === "cargando"}>
              ☆ Guardar plantilla
            </button>
          </form>
            </>
          )}
          {estado && (
            <p role="status" className={`font-sans mt-2 text-xs ${estado.tipo === "error" ? "font-bold text-terracota" : "text-ink-soft"}`}>
              {estado.texto}
            </p>
          )}
        </section>

        {/* Galería */}
        <section className={panel ? "px-3 py-3" : "px-5 py-4"}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {pest("iniciales", `Iniciales (${PLANTILLAS_BASE.length})`)}
            {pest("anuncios", `Publicidad (${PLANTILLAS_ANUNCIO.length + PLANTILLAS_COLLAGE.length})`)}
            {pest("editorial", `Noticias y cómic (${PLANTILLAS_EDITORIAL.length})`)}
            {pest("propias", `Mis plantillas${guardadas ? ` (${guardadas.length})` : ""}`)}
          </div>

          {pestana === "iniciales" ? (
            <ul className={panel ? "grid grid-cols-2 gap-2" : "grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-4"}>
              {PLANTILLAS_BASE.map((p) => tarjeta(p.id, p.nombre, p.descripcion, p.pagina))}
            </ul>
          ) : pestana === "anuncios" ? (
            <>
              <p className="font-sans mb-3 text-[0.72rem] text-ink-soft">
                Cada una lleva la etiqueta «Publicidad». Elige la imagen del anuncio y escribe su dirección en “Enlace” (https://… o https://wa.me/52…).
                Procura no poner dos páginas de anuncio seguidas.
              </p>
              <ul className={panel ? "grid grid-cols-2 gap-2" : "grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-4"}>
                {[...PLANTILLAS_ANUNCIO, ...PLANTILLAS_COLLAGE].map((p) => tarjeta(p.id, p.nombre, p.descripcion, p.pagina))}
              </ul>
            </>
          ) : pestana === "editorial" ? (
            <>
              <p className="font-sans mb-3 text-[0.72rem] text-ink-soft">
                Páginas de noticias con cifras y fotos, y cómic a página completa, listas para reemplazar textos e imágenes. Los pies de página usan {"{n:2}"}:
                el número de la página se escribe solo y se corrige si agregas o mueves páginas.
              </p>
              <ul className={panel ? "grid grid-cols-2 gap-2" : "grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-4"}>
                {PLANTILLAS_EDITORIAL.map((p) => tarjeta(p.id, p.nombre, p.descripcion, p.pagina))}
              </ul>
            </>
          ) : guardadas === null ? (
            <p className="font-sans text-sm italic text-ink-soft">Cargando…</p>
          ) : guardadas.length === 0 ? (
            <p className="font-sans text-sm italic text-ink-soft">
              Aún no guardas ninguna. Arma una página, ábrela aquí y usa “Guardar plantilla”.
            </p>
          ) : (
            <ul className={panel ? "grid grid-cols-2 gap-2" : "grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-4"}>
              {guardadas.map((p) =>
                tarjeta(
                  p.id,
                  p.nombre,
                  `Guardada el ${p.creada ? new Date(p.creada).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—"}`,
                  p.pagina,
                  <>
                    <button type="button" className={btnCls} onClick={() => renombrar(p)} title="Cambiar el nombre">✎</button>
                    <button type="button" className={btnCls} onClick={() => borrar(p)} title="Eliminar la plantilla" aria-label={`Eliminar ${p.nombre}`}>✕</button>
                  </>,
                ),
              )}
            </ul>
          )}
        </section>
    </>
  );

  if (panel)
    return (
      <section aria-label="Plantillas" className="flex h-full min-h-0 flex-col border border-ink/40 bg-white/50 dark:bg-white/5">
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ink/20 bg-paper-deep px-3 py-2">
          <h3 className="font-sans mr-auto text-xs font-bold uppercase tracking-wider">Plantillas</h3>
          <button type="button" className={btnCls} onClick={onCerrar} aria-label="Cerrar el panel">✕</button>
          <p className="font-sans basis-full text-[0.7rem] leading-snug text-ink-soft">Páginas ya diseñadas. Un clic las agrega; cambia luego los textos y fotos.</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{contenido}</div>
      </section>
    );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div role="dialog" aria-modal="true" aria-label="Plantillas de página" className="w-full max-w-5xl border-2 border-ink bg-paper shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-ink/30 bg-paper-deep px-5 py-3">
          <h2 className="font-display text-2xl font-black">Plantillas de página</h2>
          <button type="button" className={btnCls} onClick={onCerrar}>✕ Cerrar</button>
        </header>
        {contenido}
      </div>
    </div>
  );
}
