import { anunciosSeguidos, type Pagina } from "./esquema";

/** Un hallazgo de la revisión de diseño. `pagina` empieza en 1. */
export type Aviso = {
  pagina: number;
  nivel: "error" | "aviso" | "info";
  tipo: string;
  texto: string;
  /** De qué revisión viene (por omisión, de diseño). */
  grupo?: "diseno" | "accesibilidad";
  /** Elemento al que se refiere, si es uno. */
  elemento?: string;
  /** Un arreglo con un clic: campos del elemento que se cambian. */
  arreglo?: { descripcion: string; cambios: Record<string, unknown> };
};

const RELLENO = /000 000|Nombre y apellido|lorem ipsum|WhatsApp · correo|https?:\/\/(www\.)?example\.(com|org)/i;

/**
 * Revisión que solo mira los datos de la edición (no necesita dibujar nada): anuncios seguidos, enlaces y textos de
 * ejemplo sin reemplazar, imágenes sin texto alternativo. Es instantánea y se puede repetir en cada cambio.
 */
export function revisarDatos(paginas: Pagina[], fechaEdicion?: string, opciones: { hoy?: Date; publicadas?: Map<string, boolean> } = {}): Aviso[] {
  const hoy = opciones.hoy ?? new Date();
  const avisos: Aviso[] = [];
  // Los datos con fecha se comparan con el día en que la gente leerá la edición: el de publicación si aún no llega, o hoy.
  const hoyIso = hoy.toISOString().slice(0, 10);
  const lectura = fechaEdicion && /^\d{4}-\d{2}-\d{2}$/.test(fechaEdicion) && fechaEdicion > hoyIso ? fechaEdicion : hoyIso;
  const dias = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

  for (const n of anunciosSeguidos(paginas)) {
    avisos.push({ pagina: n, nivel: "info", tipo: "Anuncios seguidos", texto: "Esta página es un anuncio y junto a ella hay otro. Conviene intercalar contenido para que la publicidad no canse." });
  }

  // Los créditos por imagen son opcionales: el aviso de «foto sin crédito» solo aparece en ediciones que ya los usan
  // (alguna imagen con crédito o un texto con {creditos}); si no, serían decenas de avisos sobre algo que no se eligió usar.
  const usaCreditos = paginas.some((p) => (p.elementos ?? []).some((e) => (e.tipo === "imagen" && !!e.credito?.trim()) || (e.tipo === "texto" && e.texto.includes("{creditos}"))));

  paginas.forEach((p, i) => {
    const n = i + 1;
    const elementos = p.elementos ?? [];

    const ejemplos = elementos.filter((e) => typeof e.enlace === "string" && /example\.(com|org)/i.test(e.enlace));
    if (ejemplos.length) {
      avisos.push({ pagina: n, nivel: "aviso", tipo: "Enlace de ejemplo", texto: `${ejemplos.length} elemento(s) llevan a una dirección de ejemplo (example.com). Cámbiala por la real o quita el enlace.` });
    }

    const relleno = elementos.filter((e) => e.tipo === "texto" && RELLENO.test(e.texto));
    if (relleno.length) {
      const primero = relleno[0];
      const muestra = primero.tipo === "texto" ? primero.texto.replace(/\s+/g, " ").slice(0, 50) : "";
      avisos.push({ pagina: n, nivel: "aviso", tipo: "Texto de relleno", texto: `${relleno.length} texto(s) parecen de ejemplo sin reemplazar (p. ej. «${muestra}»).` });
    }

    // Fotos (no logos ni arte pequeño) tomadas de /media sin crédito: conviene acreditarlas en la página de créditos
    const sinCredito = elementos.filter((e) => e.tipo === "imagen" && !!e.src && e.src.startsWith("/media/") && !/logo|brand|emblema/i.test(e.src) && e.w * e.h > 40000 && !(e.credito ?? "").trim());
    if (usaCreditos && sinCredito.length) {
      avisos.push({ pagina: n, nivel: "info", tipo: "Foto sin crédito", texto: `${sinCredito.length} imagen(es) sin crédito en su ficha. Si la foto no es tuya, escribe el autor y la licencia (Crédito) y usa {creditos} en la página de créditos.` });
    }

    const viejos = elementos.filter((e) => e.dato && dias(e.dato.fecha, lectura) > (e.dato.dias ?? 7));
    if (viejos.length) {
      const peor = viejos.reduce((m, e) => (dias(e.dato!.fecha, lectura) > dias(m.dato!.fecha, lectura) ? e : m));
      const muestra = peor.tipo === "texto" ? peor.texto.replace(/\s+/g, " ").slice(0, 40) : (peor.tipo === "imagen" ? peor.alt : "") ?? "";
      avisos.push({
        pagina: n,
        nivel: "aviso",
        tipo: "Dato desactualizado",
        texto: `${viejos.length} dato(s) con fecha vieja (el más antiguo, de hace ${dias(peor.dato!.fecha, lectura)} días${muestra ? `: «${muestra}»` : ""}${peor.dato!.fuente ? `, fuente: ${peor.dato!.fuente}` : ""}). Verifica la cifra y pulsa «Verificado hoy» en su ficha.`,
      });
    }

    const botonesSinEnlace = elementos.filter((e) => e.tipo === "texto" && e.boton && (e.enlace === undefined || e.enlace === ""));
    if (botonesSinEnlace.length) {
      const t = botonesSinEnlace[0];
      avisos.push({ pagina: n, nivel: "aviso", tipo: "Botón sin enlace", texto: `${botonesSinEnlace.length} botón(es) no llevan a ningún lado (p. ej. «${t.tipo === "texto" ? t.texto.slice(0, 30) : ""}»). Selecciónalo y elige a dónde lleva en «Lleva a».` });
    }

    const visibles = elementos.filter((e) => !e.oculto);
    if (visibles.length === 0) {
      avisos.push({ pagina: n, nivel: "aviso", tipo: "Página vacía", texto: elementos.length ? "Todos sus elementos están ocultos: la página se publicaría en blanco." : "No tiene ningún elemento: se publicaría en blanco. Agrega contenido o quita la página." });
    }

    const textosVacios = visibles.filter((e) => e.tipo === "texto" && !e.texto.trim());
    if (textosVacios.length) {
      avisos.push({ pagina: n, nivel: "info", tipo: "Texto vacío", texto: `${textosVacios.length} cuadro(s) de texto sin texto (no se ven, pero estorban al seleccionar). Bórralos si no los usas.` });
    }

    const sinImagen = visibles.filter((e) => e.tipo === "imagen" && !e.src);
    if (sinImagen.length) {
      avisos.push({ pagina: n, nivel: "error", tipo: "Imagen sin archivo", texto: `${sinImagen.length} imagen(es) no tienen foto: se publicarían como un hueco. Sube o elige la foto.` });
    }

    const ocultos = elementos.length - visibles.length;
    if (ocultos > 0 && visibles.length > 0) {
      avisos.push({ pagina: n, nivel: "info", tipo: "Elementos ocultos", texto: `${ocultos} elemento(s) están ocultos y no se publican. Si ya no sirven, bórralos.` });
    }

    // Enlaces a otra edición que no existe o no está publicada: el lector vería un error 404.
    if (opciones.publicadas) {
      const rotos = visibles.filter((e) => {
        if (typeof e.enlace !== "string") return false;
        const m = /^\/ediciones\/([\w-]+)/.exec(e.enlace);
        return !!m && opciones.publicadas!.get(m[1]) !== true;
      });
      if (rotos.length) {
        avisos.push({ pagina: n, nivel: "aviso", tipo: "Enlace a edición no publicada", texto: `${rotos.length} elemento(s) llevan a otra edición que no existe o aún no está publicada (${(rotos[0].enlace as string).slice(0, 40)}).` });
      }
    }

    const sinAlt = elementos.filter((e) => e.tipo === "imagen" && !(e.alt ?? "").trim());
    if (sinAlt.length) {
      avisos.push({ pagina: n, nivel: "info", tipo: "Imagen sin descripción", grupo: "accesibilidad", texto: `${sinAlt.length} imagen(es) sin texto alternativo: lo leen los lectores de pantalla y se muestra si la imagen no carga.` });
    }
  });

  return avisos;
}

/** Un punto de la lista «antes de publicar». */
export type PuntoLista = { clave: string; titulo: string; ok: boolean; /** Si falla, qué pasa. */ detalle?: string; /** Solo sugerencia: no impide publicar. */ opcional?: boolean };

const PUNTOS_POR_TIPO: { titulo: string; tipos: string[]; opcional?: boolean }[] = [
  { titulo: "Sin textos ni enlaces de ejemplo", tipos: ["Texto de relleno", "Enlace de ejemplo"] },
  { titulo: "Todos los botones llevan a algún lado", tipos: ["Botón sin enlace"] },
  { titulo: "Datos con fecha al día", tipos: ["Dato desactualizado"] },
  { titulo: "Sin páginas vacías ni imágenes sin foto", tipos: ["Página vacía", "Imagen sin archivo"] },
  { titulo: "Enlaces a otras ediciones válidos", tipos: ["Enlace a edición no publicada"] },
  { titulo: "Imágenes con descripción", tipos: ["Imagen sin descripción", "Descripción poco útil"], opcional: true },
  { titulo: "Textos con buen contraste y tamaño", tipos: ["Contraste insuficiente", "Texto muy pequeño", "Texto sobre foto"], opcional: true },
  { titulo: "Enlaces y botones accesibles", tipos: ["Enlace sin nombre", "Texto de enlace poco claro", "Objetivo táctil pequeño"], opcional: true },
  { titulo: "Páginas con título", tipos: ["Página sin título"], opcional: true },
  { titulo: "Fotos con crédito", tipos: ["Foto sin crédito"], opcional: true },
  { titulo: "Anuncios intercalados con contenido", tipos: ["Anuncios seguidos"], opcional: true },
  { titulo: "Sin textos vacíos ni elementos ocultos", tipos: ["Texto vacío", "Elementos ocultos"], opcional: true },
];

/**
 * La lista de cosas por revisar antes de publicar: datos de la edición (tema, fecha), cada tipo de hallazgo de los datos
 * y de la revisión visual (si ya se corrió). `visual` es undefined si todavía no se revisó el diseño de las páginas.
 */
export function listaAntesDePublicar(edicion: { tema?: string; fecha?: string }, avisos: Aviso[], visual?: Aviso[]): PuntoLista[] {
  const lista: PuntoLista[] = [
    { clave: "tema", titulo: "El número tiene tema", ok: !!edicion.tema?.trim(), detalle: "Escribe el tema en «Datos de la edición»." },
    { clave: "fecha", titulo: "El número tiene fecha", ok: !!edicion.fecha, detalle: "Elige la fecha en «Datos de la edición»." },
  ];
  for (const p of PUNTOS_POR_TIPO) {
    const hallados = avisos.filter((a) => p.tipos.includes(a.tipo));
    const paginas = [...new Set(hallados.map((a) => a.pagina))];
    lista.push({
      clave: p.tipos[0],
      titulo: p.titulo,
      ok: hallados.length === 0,
      opcional: p.opcional,
      detalle: hallados.length ? `En ${paginas.length === 1 ? "la página" : "las páginas"} ${paginas.slice(0, 8).join(", ")}${paginas.length > 8 ? "…" : ""}.` : undefined,
    });
  }
  if (visual === undefined) lista.push({ clave: "visual", titulo: "Revisión visual de las páginas", ok: false, opcional: true, detalle: "Aún no se corre: busca textos encimados, letra muy chica y páginas que se salen." });
  else {
    const graves = visual.filter((a) => a.nivel !== "info");
    lista.push({ clave: "visual", titulo: "Revisión visual sin problemas", ok: graves.length === 0, detalle: graves.length ? `${graves.length} hallazgo(s) en las páginas ${[...new Set(graves.map((a) => a.pagina))].slice(0, 8).join(", ")}.` : undefined });
  }
  return lista;
}

/** Orden de gravedad para listar primero lo importante. */
export const PESO_NIVEL: Record<Aviso["nivel"], number> = { error: 0, aviso: 1, info: 2 };
