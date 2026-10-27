/**
 * Convierte un error técnico en un aviso que entienda cualquiera: qué pasó y qué hacer. Los mensajes del panel que ya
 * están en español claro («Una edición publicada no se puede borrar…») se dejan tal cual; los que vienen del navegador,
 * del disco o de la validación de datos se traducen. Sin dependencias: se usa desde el navegador.
 */

const SIN_CONEXION = /failed to fetch|networkerror|load failed|network request failed|fetch failed|err_connection|ECONNREFUSED/i;
const ERROR_DE_DISCO: [RegExp, string][] = [
  [/EBUSY|EPERM|EACCES/, "El archivo está abierto en otro programa o no hay permiso para escribirlo. Ciérralo (o cierra la otra ventana del editor) y vuelve a intentar."],
  [/ENOSPC/, "No hay espacio libre en el disco para guardar."],
  [/ENOENT/, "No se encontró un archivo o carpeta que el panel necesita. Si acabas de moverlo o borrarlo, vuelve a abrir la edición."],
];
/** Frases de la validación de datos de lib/ediciones.ts (hechas para quien edita el JSON a mano). */
const VALIDACION = /(?:"[\w.]+" (?:vale|debe|solo existe|necesita)|falta (?:el número|la lista|"|el )|se esperaba un|cada (?:elemento|bloque|globo|párrafo)|\bopciones: )/;

const POR_CODIGO: Record<number, string> = {
  400: "Lo que se envió no es válido.",
  403: "El panel no permitió esta acción. Ábrelo desde http://localhost:3000/admin.",
  404: "Eso ya no existe (¿se borró o cambió de nombre?). Vuelve a abrir la lista.",
  409: "Alguien (u otra pestaña) cambió esto al mismo tiempo. Recarga la página para ver lo último.",
  413: "El archivo es demasiado grande.",
};

function dondeEstaba(texto: string): string {
  const p = /página (\d+)/i.exec(texto)?.[1];
  const el = /elemento (\d+)/i.exec(texto)?.[1];
  if (p && el) return ` Está en la página ${p}, elemento ${el}.`;
  if (p) return ` Está en la página ${p}.`;
  return "";
}

/**
 * @param error lo que se capturó en el `catch`
 * @param accion qué se intentaba, en infinitivo y sin «No se pudo» («guardar», «subir la foto»)
 */
export function mensajeSimple(error: unknown, accion?: string): string {
  const crudo = (error instanceof Error ? error.message : typeof error === "string" ? error : "").trim();
  const intento = accion ? `No se pudo ${accion.replace(/^no se pudo /i, "").replace(/[.\s]+$/, "")}. ` : "";
  const norm = (resto: string) => (intento + resto).trim();

  if (!crudo) return norm("Ocurrió algo inesperado. Vuelve a intentar.");
  if (SIN_CONEXION.test(crudo)) return norm("No hay conexión con el panel. Revisa que el programa siga corriendo en tu computadora (npm run dev) y que estés en la misma ventana; luego vuelve a intentar.");

  const codigo = /^Error (\d{3})$/.exec(crudo)?.[1];
  if (codigo) {
    const n = Number(codigo);
    if (POR_CODIGO[n]) return norm(POR_CODIGO[n]);
    if (n >= 500) return norm(`El panel tuvo un problema (código ${n}). Vuelve a intentar; si se repite, avisa a quien mantiene el programa.`);
    return norm(`El panel respondió con el código ${n}. Vuelve a intentar.`);
  }

  for (const [re, texto] of ERROR_DE_DISCO) if (re.test(crudo)) return norm(texto);
  if (/unexpected token|JSON|is not valid/i.test(crudo) && !/[áéíóú]/i.test(crudo)) return norm("Un archivo de la edición está dañado o incompleto. Prueba con una versión anterior (Archivo → Versiones anteriores).");

  if (VALIDACION.test(crudo)) {
    const detalle = crudo.replace(/^\[ediciones\]\s*/, "").slice(0, 160);
    return norm(`Hay un dato de la edición con un formato que no es válido.${dondeEstaba(crudo)} Detalle para quien mantiene el programa: ${detalle}`);
  }

  // Ya está en español claro: se deja tal cual.
  return crudo;
}
