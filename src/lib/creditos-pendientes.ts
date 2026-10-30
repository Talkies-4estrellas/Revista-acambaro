/**
 * Créditos de fotos recién descargadas (p. ej. de Wikimedia Commons): la ruta de la foto → su crédito. El editor los toma al colocar
 * o reemplazar la foto en la hoja y los escribe en su ficha. Vive solo en el navegador, mientras dura la sesión.
 */
const pendientes = new Map<string, string>();
export const recordarCredito = (src: string, credito: string) => void pendientes.set(src, credito);
export const tomarCredito = (src: string): string | undefined => {
  const c = pendientes.get(src);
  pendientes.delete(src);
  return c;
};
