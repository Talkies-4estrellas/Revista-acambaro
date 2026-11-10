import QRCode from "qrcode";

/**
 * Código QR como un solo trazo SVG (cuadros negros de 1×1 en una cuadrícula de `tam`×`tam`), sin margen.
 * Se calcula igual en el servidor y en el navegador; quien lo dibuja pone el margen blanco alrededor (al menos 2 módulos para que se lea bien).
 */
export function trazoQr(texto: string): { tam: number; d: string } {
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: "M" });
  const tam = modules.size;
  let d = "";
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      if (!modules.get(y, x)) continue;
      // Une los cuadros seguidos de la fila en un solo rectángulo (trazo más corto).
      let largo = 1;
      while (x + largo < tam && modules.get(y, x + largo)) largo++;
      d += `M${x} ${y}h${largo}v1h-${largo}z`;
      x += largo - 1;
    }
  }
  return { tam, d };
}
