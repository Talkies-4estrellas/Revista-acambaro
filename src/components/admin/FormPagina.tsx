"use client";

import { useState } from "react";
import { TRANSICIONES, type Transicion } from "@/lib/transiciones";
import {
  ETIQUETAS_BLOQUE,
  TIPOS_BLOQUE,
  TONOS,
  bloqueNuevo,
  type Bloque,
  type Destacado,
  type Evento,
  type Medio,
  type Pagina,
  type TipoBloque,
} from "@/lib/esquema";
import {
  Area,
  Campo,
  Interruptor,
  Lista,
  ListaTextos,
  MedioEditor,
  Numero,
  Panel,
  Selector,
  Texto,
  VideoEditor,
  btnCls,
  inputCls,
} from "./campos";

const OPCIONES_TRANSICION: { valor: Transicion; etiqueta: string }[] = [
  { valor: "izquierda", etiqueta: "Izquierda — la hoja se pasa hacia la izquierda" },
  { valor: "derecha", etiqueta: "Derecha — la hoja se pasa hacia la derecha" },
  { valor: "arriba", etiqueta: "Arriba — la hoja se levanta" },
  { valor: "abajo", etiqueta: "Abajo — la hoja cae" },
  { valor: "fundido", etiqueta: "Fundido — la hoja se desvanece" },
];

/* ------------------------------ Bloques ------------------------------ */

function resumen(b: Bloque): string {
  const nombre = ETIQUETAS_BLOQUE[b.tipo];
  switch (b.tipo) {
    case "texto":
      return `${nombre}${b.parrafos[0] ? ` — ${b.parrafos[0].slice(0, 45)}` : ""}`;
    case "subtitulo":
    case "cita":
      return `${nombre} — ${b.texto.slice(0, 45)}`;
    case "imagen":
    case "gif":
      return `${nombre}${b.alt ? ` — ${b.alt}` : ""}`;
    default:
      return nombre;
  }
}

function BloqueForm({ b, set }: { b: Bloque; set: (b: Bloque) => void }) {
  switch (b.tipo) {
    case "texto":
      return (
        <div className="space-y-3">
          <ListaTextos items={b.parrafos} onChange={(parrafos) => set({ ...b, parrafos })} agregar="Agregar párrafo" etiqueta="Párrafo" filas={4} />
          <Selector
            label="Letra capitular"
            value={b.capitular === undefined ? undefined : b.capitular ? "si" : "no"}
            onChange={(v) => set({ ...b, capitular: v === undefined ? undefined : v === "si" })}
            opciones={[{ valor: "si", etiqueta: "Sí" }, { valor: "no", etiqueta: "No" }]}
            vacio="Automática (solo el primer texto de un reportaje)"
          />
          <p className="font-sans text-[0.7rem] text-ink-soft">Admite **negrita** y *cursiva*.</p>
        </div>
      );
    case "subtitulo":
      return <Texto label="Texto" value={b.texto} onChange={(texto) => set({ ...b, texto })} />;
    case "imagen":
    case "gif": {
      const { tipo, ...medio } = b;
      return (
        <MedioEditor
          value={medio}
          onChange={(m) => set({ ...m, tipo } as Bloque)}
          conAncho
          etiquetaArchivo={tipo === "gif" ? "Archivo gif / webp animado" : "Archivo de imagen"}
        />
      );
    }
    case "video": {
      const { tipo, ...video } = b;
      return <VideoEditor value={video} onChange={(v) => set({ ...v, tipo } as Bloque)} conAncho />;
    }
    case "cita":
      return (
        <div className="space-y-3">
          <Area label="Cita" value={b.texto} onChange={(texto) => set({ ...b, texto })} />
          <Texto label="Autor" value={b.autor} onChange={(autor) => set({ ...b, autor })} />
        </div>
      );
    case "lista":
      return (
        <div className="space-y-3">
          <ListaTextos items={b.items} onChange={(items) => set({ ...b, items })} agregar="Agregar elemento" etiqueta="Elemento" filas={2} />
          <Interruptor label="Lista numerada" value={b.ordenada ?? false} onChange={(v) => set({ ...b, ordenada: v || undefined })} />
        </div>
      );
    case "galeria":
      return (
        <div className="space-y-3">
          <Selector
            label="Columnas"
            value={String(b.columnas ?? 2) as "2" | "3"}
            onChange={(v) => set({ ...b, columnas: v === "3" ? 3 : 2 })}
            opciones={["2", "3"]}
          />
          <Lista<Medio>
            items={b.imagenes}
            onChange={(imagenes) => set({ ...b, imagenes })}
            nuevo={() => ({ tono: "ocre" })}
            agregar="Agregar imagen"
            titulo={(m, i) => `Imagen ${i + 1}${m.alt ? ` — ${m.alt}` : ""}`}
            render={(m, setM) => <MedioEditor value={m} onChange={setM} />}
          />
        </div>
      );
    case "agenda":
      return <EventosForm eventos={b.eventos} onChange={(eventos) => set({ ...b, eventos })} />;
    case "separador":
      return <p className="font-sans text-xs text-ink-soft">Una línea decorativa. No tiene opciones.</p>;
    case "suscripcion":
      return (
        <div className="space-y-3">
          <Texto label="Título" value={b.titulo} onChange={(titulo) => set({ ...b, titulo })} placeholder="Recibe la próxima edición" />
          <Area label="Texto" value={b.texto} onChange={(texto) => set({ ...b, texto })} rows={2} />
        </div>
      );
  }
}

function BloquesEditor({ bloques, onChange }: { bloques: Bloque[]; onChange: (b: Bloque[]) => void }) {
  const [tipo, setTipo] = useState<TipoBloque>("texto");
  return (
    <Lista<Bloque>
      items={bloques}
      onChange={onChange}
      nuevo={() => bloqueNuevo(tipo)}
      agregar=""
      vacio="Esta página aún no tiene bloques."
      titulo={(b, i) => `${i + 1}. ${resumen(b)}`}
      render={(b, set) => <BloqueForm b={b} set={set} />}
      pie={
        <div className="flex gap-2 border-t border-dashed border-ink/30 pt-3">
          <select className={`${inputCls} max-w-56`} value={tipo} onChange={(e) => setTipo(e.target.value as TipoBloque)} aria-label="Tipo de bloque">
            {TIPOS_BLOQUE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETAS_BLOQUE[t]}
              </option>
            ))}
          </select>
          <button type="button" className={btnCls} onClick={() => onChange([...bloques, bloqueNuevo(tipo)])}>
            + Agregar bloque
          </button>
        </div>
      }
    />
  );
}

function EventosForm({ eventos, onChange }: { eventos: Evento[]; onChange: (e: Evento[]) => void }) {
  return (
    <Lista<Evento>
      items={eventos}
      onChange={onChange}
      nuevo={() => ({ dia: "", mes: "", titulo: "" })}
      agregar="Agregar evento"
      titulo={(e, i) => `Evento ${i + 1}${e.titulo ? ` — ${e.titulo}` : ""}`}
      render={(e, set) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Texto label="Día" value={e.dia} onChange={(dia) => set({ ...e, dia })} placeholder="17" />
          <Texto label="Mes" value={e.mes} onChange={(mes) => set({ ...e, mes })} placeholder="OCT" />
          <Texto className="sm:col-span-2" label="Evento" value={e.titulo} onChange={(titulo) => set({ ...e, titulo })} />
          <Texto className="sm:col-span-2" label="Lugar" value={e.lugar} onChange={(lugar) => set({ ...e, lugar })} />
        </div>
      )}
    />
  );
}

/* ----------------------------- Selector página ----------------------- */

function SelectorPagina({
  label,
  value,
  onChange,
  titulos,
  vacio,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  titulos: string[];
  vacio?: string;
}) {
  return (
    <Campo label={label}>
      <select
        className={inputCls}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {titulos.map((t, i) => (
          <option key={i} value={i + 1}>
            {i + 1}. {t}
          </option>
        ))}
      </select>
    </Campo>
  );
}

/* -------------------------------- Página ----------------------------- */

export default function FormPagina({
  pagina: p,
  onChange,
  titulos,
}: {
  pagina: Pagina;
  onChange: (p: Pagina) => void;
  /** Títulos de todas las páginas, para elegir destinos de enlaces. */
  titulos: string[];
}) {
  const set = <K extends keyof Pagina>(k: K, v: Pagina[K] | undefined) => onChange({ ...p, [k]: v });
  const t = p.plantilla;
  const conCabecera = t === "reportaje" || t === "galeria" || t === "video" || t === "libre";

  return (
    <div className="space-y-5">
      <Panel titulo="Transición" ayuda="Cómo ENTRA esta página al avanzar. Al retroceder se usa la opuesta.">
        <Selector label="Giro de página" value={p.transicion} onChange={(v) => set("transicion", v ?? "izquierda")} opciones={OPCIONES_TRANSICION} />
        <p className="font-sans text-[0.7rem] text-ink-soft">
          Opciones disponibles: {TRANSICIONES.join(", ")}.
        </p>
      </Panel>

      <Panel titulo="Encabezado">
        <div className="grid gap-3 sm:grid-cols-2">
          <Texto
            className="sm:col-span-2"
            label={t === "cita" ? "Título (opcional, solo para el índice)" : "Título"}
            value={p.titulo}
            onChange={(v) => set("titulo", v)}
          />
          {t !== "cita" && t !== "indice" && <Texto label="Sección" value={p.seccion} onChange={(v) => set("seccion", v)} placeholder="Historia, Gastronomía…" />}
          {(conCabecera || t === "portada") && <Texto label="Autor" value={p.autor} onChange={(v) => set("autor", v)} />}
          {(conCabecera || t === "portada") && <Numero label="Minutos de lectura" value={p.lectura} onChange={(v) => set("lectura", v)} min={1} />}
          {(conCabecera || t === "portada") && <Texto label="Fecha (texto libre)" value={p.fecha} onChange={(v) => set("fecha", v)} placeholder="08 oct 2026" />}
          {(t === "portada" || t === "cita") && (
            <Selector label={t === "cita" ? "Color de fondo" : "Color provisional"} value={p.tono} onChange={(v) => set("tono", v)} opciones={TONOS} vacio="—" />
          )}
        </div>
        {(conCabecera || t === "portada") && <Area label="Bajada" value={p.bajada} onChange={(v) => set("bajada", v)} rows={2} hint="Resumen que aparece bajo el título y en el índice" />}
        {t !== "portada" && t !== "indice" && (
          <Interruptor label="Mostrar en el índice y en la cinta de la portada" value={p.enIndice !== false} onChange={(v) => set("enIndice", v ? undefined : false)} />
        )}
      </Panel>

      {t === "portada" && (
        <>
          <Panel titulo="Imagen de portada">
            <MedioEditor value={p.imagen ?? {}} onChange={(m) => set("imagen", m)} />
            <SelectorPagina label="El botón “Leer el reportaje” lleva a" value={p.enlace} onChange={(v) => set("enlace", v)} titulos={titulos} vacio="Página 3 (por defecto)" />
          </Panel>
          <Panel titulo="Destacados" ayuda="“Además en este número”, junto a la portada.">
            <Lista<Destacado>
              items={p.destacados ?? []}
              onChange={(d) => set("destacados", d)}
              nuevo={() => ({ titulo: "Nuevo destacado", pagina: Math.min(3, titulos.length) || 1 })}
              agregar="Agregar destacado"
              titulo={(d, i) => `${i + 1}. ${d.titulo || "Sin título"}`}
              render={(d, setD) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Texto className="sm:col-span-2" label="Título" value={d.titulo} onChange={(titulo) => setD({ ...d, titulo })} />
                  <Texto label="Sección" value={d.seccion} onChange={(seccion) => setD({ ...d, seccion })} />
                  <SelectorPagina label="Lleva a la página" value={d.pagina} onChange={(pagina) => setD({ ...d, pagina: pagina ?? 1 })} titulos={titulos} />
                  <Texto label="Autor" value={d.autor} onChange={(autor) => setD({ ...d, autor })} />
                  <Numero label="Minutos de lectura" value={d.lectura} onChange={(lectura) => setD({ ...d, lectura })} min={1} />
                  <div className="sm:col-span-2">
                    <MedioEditor value={d.imagen ?? { tono: d.tono }} onChange={(m) => setD({ ...d, imagen: m, tono: m.tono ?? d.tono })} />
                  </div>
                </div>
              )}
            />
          </Panel>
        </>
      )}

      {t === "indice" && (
        <Panel titulo="Agenda" ayuda="Opcional: aparece junto a la lista. La lista del índice se genera sola con las demás páginas.">
          <EventosForm eventos={p.agenda ?? []} onChange={(a) => set("agenda", a.length ? a : undefined)} />
        </Panel>
      )}

      {t === "reportaje" && (
        <Panel titulo="Imagen principal">
          <MedioEditor value={p.imagen ?? {}} onChange={(m) => set("imagen", m)} />
        </Panel>
      )}

      {t === "galeria" && (
        <Panel titulo="Imágenes de la galería">
          <Selector label="Columnas" value={String(p.columnas ?? 2) as "2" | "3"} onChange={(v) => set("columnas", v === "3" ? 3 : 2)} opciones={["2", "3"]} />
          <Lista<Medio>
            items={p.imagenes ?? []}
            onChange={(i) => set("imagenes", i)}
            nuevo={() => ({ tono: "ocre" })}
            agregar="Agregar imagen"
            titulo={(m, i) => `Imagen ${i + 1}${m.alt ? ` — ${m.alt}` : ""}`}
            render={(m, setM) => <MedioEditor value={m} onChange={setM} />}
          />
        </Panel>
      )}

      {t === "cita" && (
        <Panel titulo="Cita">
          <Area label="Texto de la cita" value={p.texto} onChange={(v) => set("texto", v)} rows={4} />
          <Texto label="Autor o fuente" value={p.autor} onChange={(v) => set("autor", v)} />
        </Panel>
      )}

      {t === "video" && (
        <Panel titulo="Video principal">
          <VideoEditor value={p.video ?? {}} onChange={(v) => set("video", v)} />
        </Panel>
      )}

      {(t === "reportaje" || t === "galeria" || t === "video" || t === "libre") && (
        <Panel titulo="Bloques de contenido" ayuda="Se muestran en este orden.">
          <BloquesEditor bloques={p.bloques ?? []} onChange={(b) => set("bloques", b)} />
        </Panel>
      )}
    </div>
  );
}
