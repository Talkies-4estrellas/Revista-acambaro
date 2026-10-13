/** Dirección del giro de página. Sin dependencias del servidor: lo usa también el cliente. */
export const TRANSICIONES = ["izquierda", "derecha", "arriba", "abajo", "fundido"] as const;
export type Transicion = (typeof TRANSICIONES)[number];

const OPUESTAS: Record<Transicion, Transicion> = {
  izquierda: "derecha",
  derecha: "izquierda",
  arriba: "abajo",
  abajo: "arriba",
  fundido: "fundido",
};

export const opuesta = (t: Transicion): Transicion => OPUESTAS[t];
