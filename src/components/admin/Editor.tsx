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
  aplicarMaestra,
  type EdicionDatos,
  type Elemento,
  type Pagina,
  type Plantilla,
} from "@/lib/esquema";
import { calcularNumeracion, formatoNumero, numeroFijoDe, type EntradaNumeracion } from "@/lib/numeracion";
import { MediosContext, Campo, Texto, btnCls, inputCls } from "./campos";
import FormPagina from "./FormPagina";
import EditorLienzo from "./EditorLienzo";
import PanelPaginas from "./PanelPaginas";
import { construirIndice } from "@/lib/indice";
import PlantillasModal, { type ModoAplicar } from "./PlantillasModal";
import RevisorDiseno from "./RevisorDiseno";
import { listaAntesDePublicar, revisarDatos } from "@/lib/revision";
import BibliotecaMedios from "./BibliotecaMedios";
import BuscarReemplazar from "./BuscarReemplazar";
import Versiones from "./Versiones";
import { textoCreditos } from "@/lib/referencias";

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
  marcaInicial,
}: {
  id: string;
  inicial: EdicionDatos;
  mediosIniciales: string[];
  /** Marca de modificación del archivo al abrir (detecta cambios hechos desde otra pestaña). */
  marcaInicial: number;
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
  const [verRevisor, setVerRevisor] = useState(false);
  const [verVersiones, setVerVersiones] = useState(false);
  const [verMedios, setVerMedios] = useState(false);
  const [verBuscar, setVerBuscar] = useState(false);
  /** El último «buscar y reemplazar»: cómo estaba la edición antes (para deshacerlo) y qué se hizo. */
  const [reemplazoAnterior, setReemplazoAnterior] = useState<{ antes: EdicionDatos; resumen: string } | null>(null);
  /** Cuándo se guardó por última vez en esta sesión (a mano o solo). */
  const [guardadoEn, setGuardadoEn] = useState<Date | null>(null);
  /** Copia de recuperación del navegador, de una sesión anterior, que aún no se recuperó ni se descartó. */
  const [recuperable, setRecuperable] = useState<{ t: number; datos: EdicionDatos } | null>(null);
  const copiaPendiente = useRef(false);
  /** Preferencia de autoguardado de este navegador; sin elegir, se autoguarda solo si la edición es un borrador. */
  const [autoPref, setAutoPref] = useState<boolean | null>(null);
  // Los datos de la edición (número, fecha, tema, publicación) ocupan lugar: quedan plegados salvo en una edición sin tema todavía.
  // En celular la lista de páginas ocupa media pantalla antes de llegar a la hoja: queda plegada y se cierra al elegir una página.
  const [verPaginas, setVerPaginas] = useState(false);
  /** Se editan los elementos que se repiten en todas las páginas (en lugar de una página). */
  const [editandoMaestra, setEditandoMaestra] = useState(false);
  const [verDatos, setVerDatos] = useState(() => !inicial.tema?.trim());

  const sucio = JSON.stringify(datos) !== guardado;
  const pagina = datos.paginas[Math.min(sel, datos.paginas.length - 1)];
  const idx = datos.paginas.indexOf(pagina);
  const seguidos = useMemo(() => anunciosSeguidos(datos.paginas), [datos.paginas]);
  const publicadas = useMemo(() => new Map(otras.map((o) => [o.id, o.publicada])), [otras]);
  /** Al pasar de borrador a publicada/programada: si hay pendientes, se ofrece abrir la lista antes de publicar. */
  const confirmarPublicacion = () => {
    const pend = listaAntesDePublicar(datos, revisarDatos(datos.paginas, datos.fecha, { publicadas })).filter((p) => !p.ok && !p.opcional);
    if (pend.length === 0) return true;
    const resumen = pend.slice(0, 5).map((p) => "• " + p.titulo).join("\n");
    if (confirm(`Antes de publicar hay ${pend.length} pendiente(s):\n\n${resumen}${pend.length > 5 ? "\n…" : ""}\n\nAceptar = abrir la lista y no publicar todavía.\nCancelar = publicar de todos modos.`)) {
      setVerRevisor(true);
      return false;
    }
    return true;
  };
  const titulos = useMemo(() => datos.paginas.map(tituloPagina), [datos.paginas]);
  const anclas = useMemo(() => datos.paginas.map((p) => p.ancla), [datos.paginas]);
  const creditos = useMemo(() => textoCreditos(datos.paginas), [datos.paginas]);
  const anclaRepetida = !!pagina.ancla && datos.paginas.some((p, i) => i !== idx && p.ancla === pagina.ancla);
  // En las páginas de lienzo la propia hoja es la vista previa.
  const esLienzo = pagina.plantilla === "lienzo";
  const conPrevia = verPrevia && !esLienzo;

  /* ---------------------------- Guardado ----------------------------- */

  /** Lo que no se pudo autoguardar (para no reintentar sin parar un error que no se arregla solo). */
  const fallaAuto = useRef("");

  /** Lo último que este editor vio del archivo; si el archivo cambia por otro lado, la marca ya no coincide. */
  const marca = useRef(marcaInicial);
  /** Cambios hechos fuera de este editor: «externo» se detectó sin guardar; «conflicto» el servidor se negó a pisarlos. */
  const [cambioAjeno, setCambioAjeno] = useState<null | "externo" | "conflicto">(null);

  const guardar = useCallback(async (silencioso = false, forzar = false) => {
    if (!silencioso) fallaAuto.current = "";
    setEstado({ tipo: "cargando", texto: silencioso ? "Autoguardando…" : "Guardando…" });
    try {
      const res = await fetch(`/api/admin/ediciones/${id}${forzar ? "?forzar=1" : ""}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-marca": String(marca.current) },
        body: JSON.stringify(datos),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json.conflicto) setCambioAjeno("conflicto");
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      if (typeof json.marca === "number") marca.current = json.marca;
      setCambioAjeno(null);
      setGuardado(JSON.stringify(datos));
      setGuardadoEn(new Date());
      // Al guardar publicada, la edición queda con su número para siempre (lo asigna el servidor).
      if (datos.publicada) setFijoPropio((f) => f ?? numeroEdicion);
      if (!silencioso) setVersion((v) => v + 1); // la vista previa se recarga solo al guardar a mano (no en cada autoguardado)
      setEstado({ tipo: "ok", texto: silencioso ? "Autoguardado" : "Guardado" });
    } catch (e) {
      if (silencioso) fallaAuto.current = JSON.stringify(datos);
      const motivo = e instanceof Error ? e.message : "No se pudo guardar";
      setEstado({ tipo: "error", texto: silencioso ? `No se pudo autoguardar: ${motivo}` : motivo });
    }
  }, [datos, id, numeroEdicion]);

  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;

  // Avisa si otra pestaña, otra ventana o un cambio directo al archivo modificó esta edición (se mira cada 20 s y al volver a esta pestaña).
  useEffect(() => {
    let vivo = true;
    const mirar = async () => {
      try {
        const r = await fetch(`/api/admin/ediciones/${id}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { marca?: number };
        if (vivo && typeof j.marca === "number" && j.marca !== marca.current) setCambioAjeno((c) => c ?? "externo");
      } catch {
        // sin red o servidor ocupado: se reintenta en la siguiente
      }
    };
    const cada = setInterval(mirar, 20_000);
    const alVolver = () => document.visibilityState === "visible" && mirar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      vivo = false;
      clearInterval(cada);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        guardarRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setVerBuscar(true);
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

  /* -------------------- Recuperación y autoguardado -------------------- */

  const claveCopia = `revista:borrador:${id}`;

  // Al abrir: si el navegador guardó cambios que no llegaron al archivo (se cerró la pestaña, se cayó el equipo), se ofrece recuperarlos.
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(claveCopia);
      if (crudo) {
        const b = JSON.parse(crudo) as { t: number; datos: EdicionDatos };
        if (b && b.datos && Array.isArray(b.datos.paginas) && JSON.stringify(b.datos) !== JSON.stringify(inicial)) {
          copiaPendiente.current = true;
          setRecuperable(b);
        } else localStorage.removeItem(claveCopia);
      }
      const pref = localStorage.getItem("revista:autoguardado");
      if (pref === "1" || pref === "0") setAutoPref(pref === "1");
    } catch {
      // sin localStorage (modo privado, bloqueado): simplemente no hay copia local
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Copia de recuperación en el navegador: poco después de cada cambio; se borra en cuanto lo guardado coincide.
  useEffect(() => {
    const t = setTimeout(
      () => {
        if (copiaPendiente.current) return; // no pisar la copia vieja mientras el usuario decide qué hacer con ella
        try {
          if (sucio) localStorage.setItem(claveCopia, JSON.stringify({ t: Date.now(), datos }));
          else localStorage.removeItem(claveCopia);
        } catch {
          // cuota llena o bloqueado: el autoguardado y el botón Guardar siguen funcionando
        }
      },
      sucio ? 1000 : 0,
    );
    return () => clearTimeout(t);
  }, [datos, sucio, claveCopia]);

  const autoguardar = autoPref ?? !datos.publicada;
  useEffect(() => {
    if (!autoguardar || !sucio || estado?.tipo === "cargando") return;
    if (fallaAuto.current === JSON.stringify(datos)) return;
    const t = setTimeout(() => guardarRef.current(true), 3000);
    return () => clearTimeout(t);
  }, [autoguardar, sucio, datos, estado?.tipo]);

  const cambiarAuto = (v: boolean) => {
    setAutoPref(v);
    try {
      localStorage.setItem("revista:autoguardado", v ? "1" : "0");
    } catch {}
  };

  function resolverCopia(recuperar: boolean) {
    if (recuperar && recuperable) setDatos(recuperable.datos);
    else
      try {
        localStorage.removeItem(claveCopia);
      } catch {}
    copiaPendiente.current = false;
    setRecuperable(null);
  }

  /** Carga una versión anterior en el editor: sus páginas, tema y fecha; la publicación y el número no cambian. */
  function restaurarVersion(v: EdicionDatos) {
    setDatos((d) => ({ ...d, paginas: v.paginas, tema: v.tema, fecha: v.fecha }));
    setSel(0);
    setVerVersiones(false);
    setEstado({ tipo: "ok", texto: "Versión cargada en el editor (se guarda con Guardar o con el autoguardado)" });
  }

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
      if (json.optimizado) {
        const peso = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
        setEstado({ tipo: "ok", texto: `Foto optimizada: ${peso(json.optimizado.antes)} → ${peso(json.optimizado.despues)}${json.optimizado.formato === "webp" && !/.webp$/i.test(file.name) ? " (WebP)" : ""}` });
      }
      return json.src as string;
    },
    [id],
  );

  /* ----------------------- Operaciones de página --------------------- */

  const setPaginas = (paginas: Pagina[], map?: (n: number) => number | null) =>
    setDatos((d) => ({ ...d, paginas: map ? remapRefs(paginas, map) : paginas }));

  const cambiarPagina = (p: Pagina) => setPaginas(datos.paginas.map((x, i) => (i === idx ? p : x)));

  /* ---------------- Elementos repetidos en todas las páginas ---------------- */

  const nRepetidos = datos.maestra?.elementos.length ?? 0;
  const conMaestra = (elementos: Elemento[], capa = datos.maestra?.capa): EdicionDatos["maestra"] => (elementos.length || capa ? { elementos, ...(capa ? { capa } : {}) } : undefined);
  /** La «página» que se edita en el modo de repetidos: usa el alto y el fondo de la actual para tener referencia. */
  const paginaMaestra: Pagina = {
    plantilla: "lienzo",
    transicion: "fundido",
    titulo: "Elementos repetidos",
    fondo: pagina.fondo,
    alto: pagina.alto ?? 1100,
    movil: "apilar",
    elementos: datos.maestra?.elementos ?? [],
  };
  const cambiarMaestra = (p: Pagina) => setDatos((d) => ({ ...d, maestra: conMaestra(p.elementos ?? [], d.maestra?.capa) }));
  const cambiarCapaMaestra = (capa: "encima" | "debajo") => setDatos((d) => ({ ...d, maestra: conMaestra(d.maestra?.elementos ?? [], capa) }));
  /** Pasa elementos de esta página a los repetidos (aparecen en todas las páginas de lienzo). */
  const repetirEnTodas = (els: Elemento[]) => {
    const ids = new Set(els.map((e) => e.id));
    setDatos((d) => ({
      ...d,
      maestra: conMaestra([...(d.maestra?.elementos ?? []), ...els], d.maestra?.capa),
      paginas: d.paginas.map((p, i) => (i === idx ? { ...p, elementos: (p.elementos ?? []).filter((e) => !ids.has(e.id)) } : p)),
    }));
    setEstado({ tipo: "ok", texto: `${els.length === 1 ? "1 elemento se repite" : `${els.length} elementos se repiten`} ahora en todas las páginas` });
  };
  /** Lo contrario: saca elementos de los repetidos y los deja solo en la página actual. */
  const dejarEnEstaPagina = (els: Elemento[]) => {
    const ids = new Set(els.map((e) => e.id));
    setDatos((d) => ({
      ...d,
      maestra: conMaestra((d.maestra?.elementos ?? []).filter((e) => !ids.has(e.id)), d.maestra?.capa),
      paginas: d.paginas.map((p, i) => (i === idx ? { ...p, elementos: [...(p.elementos ?? []), ...els] } : p)),
    }));
  };
  // Las miniaturas muestran cada página ya con los repetidos; se guarda el resultado por página para no redibujarlas todas en cada cambio.
  const cacheVistas = useRef(new WeakMap<Pagina, { m: unknown; r: Pagina }>());
  const paginasVistas = useMemo(
    () =>
      datos.paginas.map((p) => {
        if (!datos.maestra) return p;
        const c = cacheVistas.current.get(p);
        if (c && c.m === datos.maestra) return c.r;
        const r = aplicarMaestra(p, datos.maestra);
        cacheVistas.current.set(p, { m: datos.maestra, r });
        return r;
      }),
    [datos.paginas, datos.maestra],
  );

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

  /** Pone un identificador (a partir del título) a las páginas que no lo tienen; no cambia los que ya existen. */
  function asignarAnclas() {
    const slug = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);
    const usadas = new Set(datos.paginas.map((p) => p.ancla).filter(Boolean) as string[]);
    const nuevas = datos.paginas.map((p, i) => {
      if (p.ancla) return p;
      const base = slug(tituloPagina(p)) || `pagina-${i + 1}`;
      let a = base;
      let k = 2;
      while (usadas.has(a)) a = `${base}-${k++}`;
      usadas.add(a);
      return { ...p, ancla: a };
    });
    setPaginas(nuevas);
  }

  /** Arma (o rehace) las páginas de «Contenido» con una fila por página: usa identificadores, así que sigue bien si se mueven páginas. */
  function generarIndice() {
    const previo = datos.paginas.some((p) => p.ancla === "indice");
    if (previo && !window.confirm("Ya hay un índice generado. ¿Rehacerlo con las páginas actuales? (Se pierde lo que hayas cambiado en él.)")) return;
    const r = construirIndice(datos.paginas);
    if (r.entradas === 0) {
      window.alert("Ninguna página tiene título para el índice. Ponles título (y que estén marcadas «Mostrar en el índice») y vuelve a intentarlo.");
      return;
    }
    setPaginas(r.paginas, r.numero);
    setSel(r.posicion);
  }

  function duplicarPagina() {
    const k = idx + 1;
    const copia = [...datos.paginas];
    // El identificador (ancla) es único en la edición: la copia nace sin él.
    const nueva = structuredClone(pagina);
    delete nueva.ancla;
    copia.splice(k, 0, nueva);
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
    <MediosContext.Provider value={{ medios, subir, edicionId: id }}>
      <div className="flex min-h-screen flex-col md:h-screen">
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
              {sucio
                ? autoguardar && estado?.tipo !== "error"
                  ? "● Guardando en un momento…"
                  : "● Cambios sin guardar"
                : guardadoEn
                  ? `Guardado a las ${guardadoEn.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
                  : "Todo guardado"}
            </span>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
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
              <label
                className="font-sans flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft"
                title={
                  datos.publicada
                    ? "Guarda solo, unos segundos después de un cambio. Esta edición está publicada: por defecto no se autoguarda (los cambios se verían en el sitio sin que los revises); igual se conserva una copia de recuperación en este navegador."
                    : "Guarda solo, unos segundos después de un cambio (la edición es un borrador)."
                }
              >
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#068562]" checked={autoguardar} onChange={(e) => cambiarAuto(e.target.checked)} />
                Autoguardar
              </label>
              <button type="button" className={btnCls} onClick={() => setVerVersiones(true)} title="Ver y restaurar versiones anteriores de esta edición">
                ↶ Versiones
              </button>
              <button type="button" className={btnCls} onClick={() => setVerBuscar(true)} title="Cambia un texto, enlace, teléfono o nombre en toda la edición de una vez (Ctrl+Alt+H)">
                🔎 Reemplazar
              </button>
              <button type="button" className={btnCls} onClick={() => setVerMedios(true)} title="Todas las fotos y videos subidos: dónde se usan, cuáles sobran y cuánto pesan">
                🖼 Medios
              </button>
              <button type="button" className={btnCls} onClick={() => setVerRevisor(true)} title="Busca textos encimados, letra chica, anuncios seguidos, enlaces de ejemplo y problemas de accesibilidad (contraste, descripciones, enlaces)">
                ✓ Revisar y accesibilidad
              </button>
              <a href={`/ediciones/${id}/1`} target="_blank" rel="noreferrer" className={btnCls}>
                Abrir edición ↗
              </a>
              <button
                type="button"
                onClick={() => guardar()}
                disabled={!sucio || estado?.tipo === "cargando"}
                className="font-sans bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-paper hover:bg-terracota disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          </div>

          <div className="font-sans flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/20 px-4 py-1 text-xs text-ink-soft">
            <span className={`font-display text-base font-black ${datos.publicada || fijoPropio !== undefined ? "text-terracota" : "text-ink/40"}`} title="Número de la edición (automático)">N.º {formatoNumero(numeroEdicion)}</span>
            <span>{datos.fecha ? new Date(datos.fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "sin fecha"}</span>
            <span className="min-w-0 max-w-[24rem] truncate font-semibold text-ink">{datos.tema?.trim() || "Sin tema"}</span>
            <span className="border border-ink/30 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider">
              {!datos.publicada ? "Borrador" : estadoEdicion(datos) === "programada" ? "Programada" : "Publicada"}
            </span>
            <button type="button" className="font-bold text-terracota hover:underline" onClick={() => setVerDatos((v) => !v)} aria-expanded={verDatos}>
              {verDatos ? "▲ Ocultar datos de la edición" : "✎ Datos de la edición"}
            </button>
          </div>

          <div className={`grid gap-3 border-t border-ink/20 px-4 py-2 sm:grid-cols-[6rem_10rem_1fr_auto] sm:items-end ${verDatos ? "" : "hidden"}`}>
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
                    if (v !== "borrador" && !datos.publicada && !confirmarPublicacion()) return;
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

        {cambioAjeno && (
          <div role="alert" className="font-sans flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-ocre bg-ocre/20 px-4 py-2 text-xs">
            <span className="min-w-0 flex-1">
              <strong>{cambioAjeno === "conflicto" ? "No se guardó para no borrar cambios ajenos." : "Esta edición cambió fuera de esta pestaña."}</strong>{" "}
              Se guardó desde otra pestaña o ventana (o se editó el archivo) después de que la abriste.
              {sucio && " Tus cambios de aquí siguen en pantalla y en la copia de recuperación del navegador."}
            </span>
            <button
              type="button"
              className={btnCls}
              onClick={() => {
                if (!sucio || confirm("Se cargará la versión nueva. Tus cambios sin guardar quedan en la copia de recuperación y podrás recuperarlos al abrir. ¿Recargar?")) location.reload();
              }}
            >
              ↻ Cargar la versión nueva
            </button>
            {cambioAjeno === "conflicto" && (
              <button
                type="button"
                className={btnCls}
                onClick={() => {
                  if (confirm("Se guardará lo que ves aquí encima de la versión de la otra pestaña (queda su copia en «Versiones»). ¿Guardar encima?")) guardar(false, true);
                }}
              >
                Guardar encima
              </button>
            )}
            <button type="button" className={btnCls} onClick={() => setCambioAjeno(null)}>
              Seguir aquí
            </button>
          </div>
        )}

        {/* Cuerpo */}
        <div className={`grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)] ${conPrevia ? "xl:grid-cols-[15rem_minmax(0,1fr)_28rem]" : ""}`}>
          {/* Páginas */}
          <button
            type="button"
            onClick={() => setVerPaginas((v) => !v)}
            aria-expanded={verPaginas}
            className="font-sans flex w-full items-center gap-2 border-b border-ink/30 bg-paper-deep/50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider md:hidden"
          >
            <span aria-hidden>{verPaginas ? "▾" : "▸"}</span>
            <span>Páginas ({datos.paginas.length})</span>
            <span className="ml-auto min-w-0 truncate font-normal normal-case tracking-normal text-ink-soft">
              {idx + 1}. {titulos[idx]}
            </span>
          </button>
          <nav aria-label="Páginas" className={`${verPaginas ? "flex" : "hidden"} max-h-[22rem] min-h-0 flex-col border-b border-ink/30 bg-paper-deep/50 md:flex md:max-h-none md:border-b-0 md:border-r`}>
            <button
              type="button"
              onClick={() => {
                setEditandoMaestra((v) => !v);
                setVerPaginas(false);
              }}
              aria-pressed={editandoMaestra}
              title="Encabezado, pie, número de página…: se editan una vez y aparecen en todas las páginas de lienzo"
              className={`font-sans flex w-full items-center gap-2 border-b border-ink/30 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider ${editandoMaestra ? "bg-ink text-paper" : "hover:bg-paper-deep"}`}
            >
              <span aria-hidden>↻</span>
              <span>Elementos repetidos</span>
              <span className={`ml-auto font-normal normal-case tracking-normal ${editandoMaestra ? "" : "text-ink-soft"}`}>{nRepetidos ? `${nRepetidos}` : "ninguno"}</span>
            </button>
            <PanelPaginas
              paginas={paginasVistas}
              seleccionada={idx}
              edicionId={id}
              creditos={creditos}
              onSeleccionar={(i) => {
                setSel(i);
                setEditandoMaestra(false);
                setVerPaginas(false);
              }}
              onReordenar={reordenarPagina}
            />
            <div className="space-y-2 border-t border-ink/30 p-3">
              <p className="font-sans text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">Agregar una página</p>
              <select className={inputCls} value={nuevaPlantilla} onChange={(e) => setNuevaPlantilla(e.target.value as Plantilla)} aria-label="Tipo de la página nueva">
                {PLANTILLAS.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETAS_PLANTILLA[t]}
                  </option>
                ))}
              </select>
              <button type="button" className={`${btnCls} w-full !bg-ink !text-paper`} onClick={agregarPagina}>
                + Agregar después de la {idx + 1}
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" className={btnCls} onClick={() => setVerPlantillas(true)} title="Usar una plantilla ya diseñada (o guardar esta página como plantilla)">
                  ▤ Plantillas
                </button>
                <button type="button" className={btnCls} onClick={generarIndice} title="Crea la página «Contenido» con todas las páginas de la edición (y la rehace si ya la generaste)">
                  ☰ Índice
                </button>
              </div>
            </div>
          </nav>

          {/* Formulario */}
          <main className="min-h-0 px-3 py-4 md:overflow-y-auto md:px-5">
            {recuperable && (
              <div role="alert" className="font-sans mb-3 flex flex-wrap items-center gap-3 border-l-4 border-terracota bg-terracota/10 px-3 py-2 text-xs">
                <span className="min-w-0 flex-1">
                  <strong>Hay cambios sin guardar de una sesión anterior</strong> (
                  {new Date(recuperable.t).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}). El navegador los
                  conservó por si se cerró la pestaña o se cayó el equipo.
                </span>
                <button type="button" className={`${btnCls} !bg-ink !text-paper`} onClick={() => resolverCopia(true)}>
                  Recuperarlos
                </button>
                <button type="button" className={btnCls} onClick={() => resolverCopia(false)}>
                  Descartarlos
                </button>
              </div>
            )}
            {seguidos.length > 0 && (
              <p role="status" className="font-sans mb-3 border-l-4 border-ocre bg-ocre/15 px-3 py-2 text-xs">
                <strong>Anuncios seguidos:</strong> {textoSeguidos(seguidos)}. Conviene intercalar contenido entre un anuncio y otro para que la publicidad no canse al lector.
              </p>
            )}
            {editandoMaestra && (
              <div className="font-sans mb-3 border-l-4 border-terracota bg-terracota/10 px-3 py-2 text-xs">
                <p>
                  <strong>Elementos repetidos.</strong> Lo que pongas aquí aparece en <strong>todas</strong> las páginas de lienzo (menos las que lo omitan en su panel «Hoja»). Se muestra atenuado el contenido de la página{" "}
                  {idx + 1} como referencia. En un texto, <code>{"{n}"}</code> es el número de la página donde cae.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    Se dibuja
                    <select className={`${inputCls} !w-auto`} value={datos.maestra?.capa ?? "encima"} onChange={(e) => cambiarCapaMaestra(e.target.value as "encima" | "debajo")}>
                      <option value="encima">encima del contenido</option>
                      <option value="debajo">detrás del contenido</option>
                    </select>
                  </label>
                  <button type="button" className={`${btnCls} !bg-ink !text-paper`} onClick={() => setEditandoMaestra(false)}>
                    ✓ Terminar
                  </button>
                </div>
              </div>
            )}
            <div className={`mb-2 flex flex-wrap items-center justify-between gap-2 ${editandoMaestra ? "hidden" : ""}`}>
              <h2 className="font-display text-xl font-black">
                Página {idx + 1} <span className="text-base font-bold italic text-ink-soft">· {ETIQUETAS_PLANTILLA[pagina.plantilla]}</span>
              </h2>
              <div className="flex flex-wrap gap-1">
                <button type="button" className={btnCls} disabled={idx === 0} onClick={() => moverPagina(-1)}>↑ Subir</button>
                <button type="button" className={btnCls} disabled={idx === datos.paginas.length - 1} onClick={() => moverPagina(1)}>↓ Bajar</button>
                <button type="button" className={btnCls} onClick={() => setVerPlantillas(true)} title="Guardar esta página como plantilla o usar una">▤ Plantillas</button>
                <button type="button" className={btnCls} onClick={duplicarPagina}>⧉ Duplicar</button>
                <button type="button" className={btnCls} disabled={datos.paginas.length <= 1} onClick={quitarPagina}>✕ Quitar</button>
              </div>
            </div>
            <details className={`mb-3 border border-ink/20 bg-paper-deep/40 ${editandoMaestra ? "hidden" : ""}`} open={anclaRepetida || undefined}>
              <summary className="font-sans cursor-pointer select-none px-3 py-1.5 text-xs font-bold text-ink-soft hover:text-ink">
                ⚙ Identificador de la página{pagina.ancla ? `: #${pagina.ancla}` : " (opcional)"}
              </summary>
              <div className="px-3 pb-2">
              <Texto
                label="Identificador"
                value={pagina.ancla ?? ""}
                placeholder="editorial, noticias, cupones…"
                onChange={(v) => {
                  // Solo letras minúsculas, números, - y _ (sin acentos ni espacios), como los nombres de archivo
                  const limpio = v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 40);
                  cambiarPagina({ ...pagina, ancla: limpio || undefined });
                }}
              />
              <p className={`font-sans mt-1 text-[0.7rem] leading-snug ${anclaRepetida ? "font-bold text-terracota" : "text-ink-soft"}`}>
                {anclaRepetida
                  ? "Ese identificador ya lo usa otra página: cada uno debe ser único."
                  : pagina.ancla
                    ? `Para enlazar esta página usa «Lleva a» (queda como #${pagina.ancla} y sigue a la página si la mueves). Para escribir su número en un texto (índice, portada) pon {p:${pagina.ancla}}, o {p:${pagina.ancla}:2} para «07». En un pie de página, {n} es el número de la página donde está.`
                    : "Si le pones un identificador, el índice y los enlaces con su número se corrigen solos al agregar, quitar o mover páginas."}
              </p>
              {datos.paginas.some((p) => !p.ancla) && (
                <button type="button" className={`${btnCls} mt-2`} onClick={asignarAnclas} title="Genera un identificador a partir del título de cada página que no tenga uno">
                  Poner identificador a las {datos.paginas.filter((p) => !p.ancla).length} páginas que no lo tienen
                </button>
              )}
              </div>
            </details>
            {editandoMaestra ? (
              <EditorLienzo
                key="repetidos"
                pagina={paginaMaestra}
                onChange={cambiarMaestra}
                paginas={titulos}
                anclas={anclas}
                indice={idx}
                creditos={creditos}
                edicionId={id}
                fantasma={esLienzo ? (pagina.elementos ?? []) : undefined}
                fantasmaDetras
                etiquetaMover={esLienzo ? "↧ Solo en esta página" : undefined}
                onMover={esLienzo ? dejarEnEstaPagina : undefined}
              />
            ) : esLienzo ? (
              <EditorLienzo key={idx} pagina={pagina} onChange={cambiarPagina}
                fantasma={datos.maestra && !pagina.sinMaestra ? datos.maestra.elementos : undefined}
                fantasmaDetras={datos.maestra?.capa === "debajo"}
                etiquetaMover="↻ Repetir en todas"
                onMover={repetirEnTodas}
                repetidos={nRepetidos} onPlantillas={() => setVerPlantillas(true)} paginas={titulos} anclas={anclas} indice={idx} creditos={creditos} edicionId={id} />
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
      {verBuscar && (
        <BuscarReemplazar
          datos={datos}
          paginas={titulos}
          ultimo={reemplazoAnterior ? { resumen: reemplazoAnterior.resumen } : null}
          onAplicar={(nuevos, resumen) => {
            setReemplazoAnterior({ antes: datos, resumen });
            setDatos(nuevos);
          }}
          onDeshacer={() => {
            if (reemplazoAnterior) setDatos(reemplazoAnterior.antes);
            setReemplazoAnterior(null);
          }}
          onIr={(pagina) => {
            if (pagina === -1) setVerDatos(true);
            else setSel(pagina - 1);
          }}
          onCerrar={() => setVerBuscar(false)}
        />
      )}
      {verMedios && <BibliotecaMedios edicionId={id} onCerrar={() => setVerMedios(false)} />}
      {verVersiones && <Versiones edicionId={id} sucio={sucio} onRestaurar={restaurarVersion} onCerrar={() => setVerVersiones(false)} />}
      {verRevisor && <RevisorDiseno edicionId={id} paginas={datos.paginas} fecha={datos.fecha} tema={datos.tema} publicadas={publicadas} sucio={sucio} paginaActual={idx} onIr={setSel}
          onArreglar={(a) => {
            // Cambia los campos indicados en el elemento del aviso (los que valen undefined se quitan).
            if (!a.arreglo || !a.elemento) return;
            setDatos((d) => ({
              ...d,
              paginas: d.paginas.map((p, i) =>
                i !== a.pagina - 1
                  ? p
                  : {
                      ...p,
                      elementos: (p.elementos ?? []).map((el) => {
                        if (el.id !== a.elemento) return el;
                        const nuevo = { ...el, ...a.arreglo!.cambios } as Record<string, unknown>;
                        for (const k of Object.keys(a.arreglo!.cambios)) if (nuevo[k] === undefined) delete nuevo[k];
                        return nuevo as unknown as typeof el;
                      }),
                    },
              ),
            }));
          }}
          onCerrar={() => setVerRevisor(false)}
        />}
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

