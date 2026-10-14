"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ETIQUETAS_PLANTILLA,
  PLANTILLAS,
  anunciosSeguidos,
  estadoEdicion,
  paginaDesdePlantilla,
  paginaNueva,
  type EdicionDatos,
  type Pagina,
  type Plantilla,
} from "@/lib/esquema";
import { calcularNumeracion, formatoNumero, numeroFijoDe, type EntradaNumeracion } from "@/lib/numeracion";
import { MediosContext, Campo, Texto, btnCls, inputCls } from "./campos";
import FormPagina from "./FormPagina";
import EditorLienzo from "./EditorLienzo";
import PanelPaginas from "./PanelPaginas";
import PlantillasModal, { type ModoAplicar } from "./PlantillasModal";

/** «las páginas 7 y 8» / «las páginas 4 a 6 y 10 y 11», a partir de los números de página que son anuncios pegados. */
function textoSeguidos(paginas: number[]) {
  const grupos: number[][] = [];
  for (const n of paginas) {
    const g = grupos[grupos.length - 1];
    if (g && n === g[g.length - 1] + 1) g.push(n);
    else grupos.push([n]);
  }
  const t = grupos.map((g) => (g.length === 2 ? `${g[0]} y ${g[1]}` : `${g[0]} a ${g[g.length - 1]}`));
  return `páginas ${t.join("; ")}`;
}

/** Mantiene válidas las referencias a páginas (enlace y destacados) cuando cambia la numeración. */
function remapRefs(paginas: Pagina[], map: (n: number) => number | null): Pagina[] {
  return paginas.map((p) => {
    let q = p;
    if (q.enlace !== undefined) q = { ...q, enlace: map(q.enlace) ?? undefined };
    if (q.destacados) q = { ...q, destacados: q.destacados.map((d) => ({ ...d, pagina: map(d.pagina) ?? 1 })) };
    // Enlaces a otras páginas de los elementos de una página en blanco (los de direcciones externas no cambian).
    if (q.elementos?.some((e) => typeof e.enlace === "number"))
      q = { ...q, elementos: q.elementos.map((e) => (typeof e.enlace === "number" ? ({ ...e, enlace: map(e.enlace) ?? undefined } as typeof e) : e)) };
    return q;
  });
}

/** Mañana a las 09:00, hora de Ciudad de México (UTC−6), como AAAA-MM-DDTHH:mm. */
function sugerirPublicacion() {
  const manana = new Date(Date.now() - 6 * 3600_000 + 24 * 3600_000);
  return `${manana.toISOString().slice(0, 10)}T09:00`;
}

const tituloPagina =(p: Pagina) => p.titulo || (p.plantilla === "cita" ? (p.texto ?? "").slice(0, 40) : "") || ETIQUETAS_PLANTILLA[p.plantilla];

export default function Editor({
  id,
  inicial,
  mediosIniciales,
  otras,
}: {
  id: string;
  inicial: EdicionDatos;
  mediosIniciales: string[];
  /** Las demás ediciones, para calcular el número de esta (automático). */
  otras: EntradaNumeracion[];
}) {
  const [datos, setDatos] = useState<EdicionDatos>(inicial);
  // Una edición que ya se publicó conserva su número aunque se desactive (queda fijo al publicarla).
  const [fijoPropio, setFijoPropio] = useState(() => numeroFijoDe(inicial));
  const numeroEdicion = useMemo(
    () => calcularNumeracion([...otras, { id, fecha: datos.fecha, publicada: datos.publicada, publicarEn: datos.publicarEn, fijo: fijoPropio }]).get(id)?.numero ?? 1,
    [otras, id, datos.fecha, datos.publicada, datos.publicarEn, fijoPropio],
  );
  const [guardado, setGuardado] = useState(() => JSON.stringify(inicial));
  const [sel, setSel] = useState(0);
  const [estado, setEstado] = useState<{ tipo: "ok" | "error" | "cargando"; texto: string } | null>(null);
  const [version, setVersion] = useState(0);
  const [verPrevia, setVerPrevia] = useState(true);
  const [medios, setMedios] = useState(mediosIniciales);
  const [nuevaPlantilla, setNuevaPlantilla] = useState<Plantilla>("lienzo");
  const [verPlantillas, setVerPlantillas] = useState(false);

  const sucio = JSON.stringify(datos) !== guardado;
  const pagina = datos.paginas[Math.min(sel, datos.paginas.length - 1)];
  const idx = datos.paginas.indexOf(pagina);
  const seguidos = useMemo(() => anunciosSeguidos(datos.paginas), [datos.paginas]);
  const titulos = useMemo(() => datos.paginas.map(tituloPagina), [datos.paginas]);
  // En las páginas de lienzo la propia hoja es la vista previa.
  const esLienzo = pagina.plantilla === "lienzo";
  const conPrevia = verPrevia && !esLienzo;

  /* ---------------------------- Guardado ----------------------------- */

  const guardar = useCallback(async () => {
    setEstado({ tipo: "cargando", texto: "Guardando…" });
    try {
      const res = await fetch(`/api/admin/ediciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setGuardado(JSON.stringify(datos));
      // Al guardar publicada, la edición queda con su número para siempre (lo asigna el servidor).
      if (datos.publicada) setFijoPropio((f) => f ?? numeroEdicion);
      setVersion((v) => v + 1);
      setEstado({ tipo: "ok", texto: "Guardado" });
    } catch (e) {
      setEstado({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo guardar" });
    }
  }, [datos, id, numeroEdicion]);

  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        guardarRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!sucio) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sucio]);

  /* ----------------------------- Medios ------------------------------ */

  const subir = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.set("edicion", id);
      form.set("archivo", file);
      const res = await fetch("/api/admin/medios", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setMedios((m) => (m.includes(json.src) ? m : [...m, json.src].sort()));
      return json.src as string;
    },
    [id],
  );

  /* ----------------------- Operaciones de página --------------------- */

  const setPaginas = (paginas: Pagina[], map?: (n: number) => number | null) =>
    setDatos((d) => ({ ...d, paginas: map ? remapRefs(paginas, map) : paginas }));

  const cambiarPagina = (p: Pagina) => setPaginas(datos.paginas.map((x, i) => (i === idx ? p : x)));

  /**
   * Usa una plantilla: como página nueva (después de la actual) o reemplazando el contenido de la actual.
   * Al reemplazar se conservan el título, la sección, el resumen y su lugar en el índice.
   */
  function aplicarPlantilla(plantilla: Pagina, nombre: string, modo: ModoAplicar) {
    const copia = paginaDesdePlantilla(plantilla);
    if (modo === "reemplazar") {
      const { titulo, seccion, bajada, enIndice } = pagina;
      setPaginas(
        datos.paginas.map((x, i) =>
          i === idx ? { ...copia, titulo: titulo ?? copia.titulo, seccion, bajada, enIndice } : x,
        ),
      );
    } else {
      const k = idx + 1;
      const lista = [...datos.paginas];
      lista.splice(k, 0, { ...copia, titulo: nombre });
      setPaginas(lista, (n) => (n - 1 >= k ? n + 1 : n));
      setSel(k);
    }
    setVerPlantillas(false);
  }

  function agregarPagina() {
    const k = idx + 1;
    const copia = [...datos.paginas];
    copia.splice(k, 0, paginaNueva(nuevaPlantilla));
    setPaginas(copia, (n) => (n - 1 >= k ? n + 1 : n));
    setSel(k);
  }

  function duplicarPagina() {
    const k = idx + 1;
    const copia = [...datos.paginas];
    copia.splice(k, 0, structuredClone(pagina));
    setPaginas(copia, (n) => (n - 1 >= k ? n + 1 : n));
    setSel(k);
  }

  /**
   * Mueve la página `desde` a la posición `hasta` (índices de 0 a n-1 en el orden resultante). Los enlaces a números de
   * página (`enlace` y destacados de la portada) se corrigen para que sigan apuntando a la misma página.
   */
  function reordenarPagina(desde: number, hasta: number) {
    const n = datos.paginas.length;
    if (desde === hasta || desde < 0 || hasta < 0 || desde >= n || hasta >= n) return;
    const orden = datos.paginas.map((_, i) => i);
    const [movida] = orden.splice(desde, 1);
    orden.splice(hasta, 0, movida);
    const nuevoNumero = new Map(orden.map((viejo, nuevo) => [viejo + 1, nuevo + 1]));
    setPaginas(
      orden.map((i) => datos.paginas[i]),
      (num) => nuevoNumero.get(num) ?? num,
    );
    setSel(hasta);
  }

  function moverPagina(d: -1 | 1) {
    reordenarPagina(idx, idx + d);
  }

  function quitarPagina() {
    if (datos.paginas.length <= 1) return;
    if (!confirm(`¿Quitar la página ${idx + 1} “${tituloPagina(pagina)}”? Se puede deshacer cerrando sin guardar.`)) return;
    const copia = datos.paginas.filter((_, i) => i !== idx);
    setPaginas(copia, (n) => (n === idx + 1 ? null : n > idx + 1 ? n - 1 : n));
    setSel(Math.max(0, idx - 1));
  }

  /* ------------------------------- UI -------------------------------- */

  return (
    <MediosContext.Provider value={{ medios, subir }}>
      <div className="flex h-screen flex-col">
        {/* Barra superior */}
        <header className="border-b-2 border-ink bg-paper">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
            <Link href="/admin" className="font-sans text-xs font-bold uppercase tracking-wider text-terracota hover:underline">
              ← Ediciones
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/emblema.svg" alt="" className="h-7 w-auto" />
            <h1 className="font-display text-xl font-black">Edición {id}</h1>
            <span className={`font-sans text-xs ${sucio ? "font-bold text-terracota" : "text-ink-soft"}`}>
              {sucio ? "● Cambios sin guardar" : "Todo guardado"}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {estado && (
                <span
                  role="status"
                  className={`font-sans max-w-md truncate text-xs ${estado.tipo === "error" ? "font-bold text-terracota" : "text-ink-soft"}`}
                  title={estado.texto}
                >
                  {estado.texto}
                </span>
              )}
              <button type="button" className={`${btnCls} hidden ${esLienzo ? "" : "xl:inline-block"}`} onClick={() => setVerPrevia((v) => !v)}>
                {verPrevia ? "Ocultar vista previa" : "Vista previa"}
              </button>
              <a href={`/ediciones/${id}/1`} target="_blank" rel="noreferrer" className={btnCls}>
                Abrir edición ↗
              </a>
              <button
                type="button"
                onClick={guardar}
                disabled={!sucio || estado?.tipo === "cargando"}
                className="font-sans bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-paper hover:bg-terracota disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-ink/20 px-4 py-2 sm:grid-cols-[6rem_10rem_1fr_auto] sm:items-end">
            <Campo label="Número" hint={fijoPropio !== undefined ? "Fijo: ya se publicó" : datos.publicada ? "Se fija al guardar" : "Se asigna al publicar"}>
              <p className={`font-display text-3xl font-black leading-none ${datos.publicada || fijoPropio !== undefined ? "text-terracota" : "text-ink/30"}`} title="El número es automático: sigue a la última edición publicada y, una vez publicada, no cambia">
                {formatoNumero(numeroEdicion)}
              </p>
            </Campo>
            <Campo label="Fecha">
              <input type="date" className={inputCls} value={datos.fecha} onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} />
            </Campo>
            <Texto label="Tema del número" value={datos.tema} onChange={(tema) => setDatos({ ...datos, tema })} />
            <div className="flex flex-wrap items-end gap-2">
              <Campo label="Publicación">
                <select
                  className={inputCls}
                  value={!datos.publicada ? "borrador" : datos.publicarEn ? "programada" : "publicada"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "borrador") setDatos({ ...datos, publicada: false, publicarEn: undefined });
                    else if (v === "publicada") setDatos({ ...datos, publicada: true, publicarEn: undefined });
                    else setDatos({ ...datos, publicada: true, publicarEn: datos.publicarEn ?? sugerirPublicacion() });
                  }}
                >
                  <option value="borrador">{fijoPropio !== undefined ? `Desactivada (conserva la N.º ${formatoNumero(fijoPropio)})` : "Borrador"}</option>
                  <option value="publicada">Publicada ya</option>
                  <option value="programada">Programada…</option>
                </select>
              </Campo>
              {datos.publicada && datos.publicarEn && (
                <Campo label="Se publica (hora de Ciudad de México)">
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={datos.publicarEn}
                    onChange={(e) => setDatos({ ...datos, publicarEn: e.target.value || sugerirPublicacion() })}
                  />
                </Campo>
              )}
              {datos.publicada && datos.publicarEn && (
                <p className="font-sans pb-2 text-xs font-bold text-ink-soft">
                  {estadoEdicion(datos) === "programada" ? "⏰ Aún no es pública" : "✓ Ya es pública"}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Cuerpo */}
        <div className={`grid min-h-0 flex-1 grid-cols-[15rem_minmax(0,1fr)] ${conPrevia ? "xl:grid-cols-[15rem_minmax(0,1fr)_28rem]" : ""}`}>
          {/* Páginas */}
          <nav aria-label="Páginas" className="flex min-h-0 flex-col border-r border-ink/30 bg-paper-deep/50">
            <PanelPaginas
              paginas={datos.paginas}
              seleccionada={idx}
              edicionId={id}
              onSeleccionar={setSel}
              onReordenar={reordenarPagina}
            />
            <div className="space-y-2 border-t border-ink/30 p-3">
              <button type="button" className={`${btnCls} w-full`} onClick={() => setVerPlantillas(true)} title="Usar o guardar plantillas de página">
                ▤ Plantillas…
              </button>
              <select className={inputCls} value={nuevaPlantilla} onChange={(e) => setNuevaPlantilla(e.target.value as Plantilla)} aria-label="Plantilla de la página nueva">
                {PLANTILLAS.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETAS_PLANTILLA[t]}
                  </option>
                ))}
              </select>
              <button type="button" className={`${btnCls} w-full`} onClick={agregarPagina}>
                + Agregar página después de la {idx + 1}
              </button>
            </div>
          </nav>

          {/* Formulario */}
          <main className="min-h-0 overflow-y-auto px-5 py-4">
            {seguidos.length > 0 && (
              <p role="status" className="font-sans mb-3 border-l-4 border-ocre bg-ocre/15 px-3 py-2 text-xs">
                <strong>Anuncios seguidos:</strong> {textoSeguidos(seguidos)}. Conviene intercalar contenido entre un anuncio y otro para que la publicidad no canse al lector.
              </p>
            )}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-black">
                Página {idx + 1} <span className="text-base font-bold italic text-ink-soft">· {ETIQUETAS_PLANTILLA[pagina.plantilla]}</span>
              </h2>
              <div className="flex gap-1">
                <button type="button" className={btnCls} disabled={idx === 0} onClick={() => moverPagina(-1)}>↑ Subir</button>
                <button type="button" className={btnCls} disabled={idx === datos.paginas.length - 1} onClick={() => moverPagina(1)}>↓ Bajar</button>
                <button type="button" className={btnCls} onClick={() => setVerPlantillas(true)} title="Guardar esta página como plantilla o usar una">▤ Plantillas</button>
                <button type="button" className={btnCls} onClick={duplicarPagina}>⧉ Duplicar</button>
                <button type="button" className={btnCls} disabled={datos.paginas.length <= 1} onClick={quitarPagina}>✕ Quitar</button>
              </div>
            </div>
            {esLienzo ? (
              <EditorLienzo key={idx} pagina={pagina} onChange={cambiarPagina} paginas={titulos} edicionId={id} />
            ) : (
              <FormPagina key={idx} pagina={pagina} onChange={cambiarPagina} titulos={titulos} />
            )}
          </main>

          {/* Vista previa */}
          {conPrevia && (
            <aside aria-label="Vista previa" className="hidden min-h-0 flex-col border-l border-ink/30 bg-paper-deep/50 xl:flex">
              <div className="font-sans flex items-center justify-between border-b border-ink/20 px-3 py-1.5 text-[0.7rem] text-ink-soft">
                <span>Vista previa de la última versión guardada</span>
                <button type="button" className="font-bold hover:text-terracota" onClick={() => setVersion((v) => v + 1)}>
                  Recargar
                </button>
              </div>
              <iframe
                key={`${idx}-${version}`}
                src={`/ediciones/${id}/${idx + 1}`}
                title="Vista previa de la página"
                className="min-h-0 w-full flex-1 border-0 bg-paper"
              />
              {sucio && (
                <p className="font-sans border-t border-ink/20 px-3 py-1.5 text-[0.7rem] text-terracota">
                  Hay cambios sin guardar: guarda (Ctrl+S) para verlos aquí.
                </p>
              )}
            </aside>
          )}
        </div>
      </div>
      {verPlantillas && (
        <PlantillasModal
          paginaActual={pagina}
          numeroPagina={idx + 1}
          onAplicar={aplicarPlantilla}
          onCerrar={() => setVerPlantillas(false)}
        />
      )}
    </MediosContext.Provider>
  );
}

