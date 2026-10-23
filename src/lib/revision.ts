import { anunciosSeguidos, type Pagina } from "./esquema";

/** Un hallazgo de la revisión de diseño. `pagina` empieza en 1. */
export type Aviso = {
  pagina: number;
  nivel: "error" | "aviso" | "info";
  tipo: string;
  texto: string;
};

const RELLENO = /000 000|Nombre y apellido|lorem ipsum|WhatsApp · correo|https?:\/\/(www\.)?example\.(com|org)/i;

/**
 * Revisión que solo mira los datos de la edición (no necesita dibujar nada): anuncios seguidos, enlaces y textos de
 * ejemplo sin reemplazar, imágenes sin texto alternativo. Es instantánea y se puede repetir en cada cambio.
 */
export function revisarDatos(paginas: Pagina[], fechaEdicion?: string, hoy = new Date()): Aviso[] {
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

    const sinAlt = elementos.filter((e) => e.tipo === "imagen" && !(e.alt ?? "").trim());
    if (sinAlt.length) {
      avisos.push({ pagina: n, nivel: "info", tipo: "Imagen sin descripción", texto: `${sinAlt.length} imagen(es) sin texto alternativo: lo leen los lectores de pantalla y se muestra si la imagen no carga.` });
    }
  });

  return avisos;
}

/** Orden de gravedad para listar primero lo importante. */
export const PESO_NIVEL: Record<Aviso["nivel"], number> = { error: 0, aviso: 1, info: 2 };
