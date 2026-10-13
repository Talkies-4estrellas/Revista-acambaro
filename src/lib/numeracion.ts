/**
 * Numeración automática de ediciones. Sin dependencias del servidor: la usan el sitio, el panel y el editor.
 *
 * - Una edición recibe su número la primera vez que se publica (o se programa) y **lo conserva para siempre**,
 *   aunque después se desactive o vuelva a borrador. La nueva edición toma el siguiente al número más alto ya asignado.
 * - Los borradores que nunca se publicaron no cuentan: solo muestran el número que recibirían (siguientes, en orden
 *   de fecha). Si se borra o se publica uno, los demás borradores se reubican solos.
 */

export type EntradaNumeracion = {
  id: string;
  fecha: string;
  publicada: boolean;
  publicarEn?: string;
  /** Número ya asignado (la edición se publicó alguna vez). */
  fijo?: number;
};
export type Numero = {
  numero: number;
  /** true = borrador que nunca se publicó: el número es solo el previsto. */
  provisional: boolean;
};

export const formatoNumero = (n: number) => String(n).padStart(2, "0");

/** Número fijo guardado en el archivo (texto "02" → 2), o undefined si la edición no lo tiene asignado. */
export const numeroFijoDe = (e: { numero?: string; numeroFijo?: boolean }): number | undefined => {
  if (!e.numeroFijo) return undefined;
  const n = Number.parseInt(e.numero ?? "", 10);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

/** Momento en que la edición se hace pública (programado o su fecha), para ordenar. */
const clavePublicacion = (e: EntradaNumeracion) => e.publicarEn ?? `${e.fecha}T00:00`;

export function calcularNumeracion(lista: EntradaNumeracion[]): Map<string, Numero> {
  const porId = (a: EntradaNumeracion, b: EntradaNumeracion) => a.id.localeCompare(b.id);
  const salida = new Map<string, Numero>();

  // 1) Las que ya tienen número lo conservan.
  const conFijo = lista.filter((e) => e.fijo !== undefined);
  conFijo.forEach((e) => salida.set(e.id, { numero: e.fijo!, provisional: false }));
  let siguiente = Math.max(0, ...conFijo.map((e) => e.fijo!)) + 1;

  // 2) Publicadas que aún no tienen número: reciben las siguientes, por orden de publicación.
  lista
    .filter((e) => e.fijo === undefined && e.publicada)
    .sort((a, b) => clavePublicacion(a).localeCompare(clavePublicacion(b)) || porId(a, b))
    .forEach((e) => salida.set(e.id, { numero: siguiente++, provisional: false }));

  // 3) Borradores que nunca se publicaron: número previsto.
  lista
    .filter((e) => e.fijo === undefined && !e.publicada)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || porId(a, b))
    .forEach((e) => salida.set(e.id, { numero: siguiente++, provisional: true }));

  return salida;
}
