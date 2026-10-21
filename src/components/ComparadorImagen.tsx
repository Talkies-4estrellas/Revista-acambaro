"use client";

import { useState, type CSSProperties } from "react";

/**
 * Comparador «antes y después»: dos fotos del mismo tamaño y un deslizador. La foto «antes» se ve a la izquierda de la línea y la «después» a la
 * derecha. El control es un <input type="range"> invisible que cubre toda la foto: funciona con ratón, dedo y teclado (flechas) sin código de arrastre
 * propio. Con `estatico` (editor y miniaturas) se dibuja a la mitad y no responde, para no estorbar al editar.
 */
export default function ComparadorImagen({
  antes,
  despues,
  altAntes,
  altDespues,
  etiquetaAntes,
  etiquetaDespues,
  estilo,
  estatico = false,
}: {
  antes: string;
  despues: string;
  altAntes?: string;
  altDespues?: string;
  etiquetaAntes?: string;
  etiquetaDespues?: string;
  /** Estilo común de las dos fotos (ajuste, enfoque, filtro). */
  estilo: CSSProperties;
  estatico?: boolean;
}) {
  const [pos, setPos] = useState(50);
  const chip: CSSProperties = {
    position: "absolute",
    top: "1.2cqw",
    padding: "0.4cqw 1.1cqw",
    background: "rgba(20,17,13,.72)",
    color: "#fff",
    fontFamily: "var(--font-sans, sans-serif)",
    fontWeight: 800,
    fontSize: "max(10px, 1.7cqw)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    pointerEvents: "none",
    borderRadius: "0.6cqw",
  };
  const aAntes = etiquetaAntes ?? "Antes";
  const aDespues = etiquetaDespues ?? "Después";

  return (
    <div data-sin-giro style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={despues} alt={altDespues ?? aDespues} draggable={false} loading="lazy" style={estilo} />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={antes} alt={altAntes ?? aAntes} draggable={false} loading="lazy" style={estilo} />
      </div>
      <span style={{ ...chip, left: "1.2cqw" }}>{aAntes}</span>
      <span style={{ ...chip, right: "1.2cqw" }}>{aDespues}</span>
      <span aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: "0.35cqw", minWidth: 2, background: "#fff", transform: "translateX(-50%)", boxShadow: "0 0 0 1px rgba(0,0,0,.3)", pointerEvents: "none" }} />
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: `${pos}%`,
          width: "6cqw",
          height: "6cqw",
          minWidth: 32,
          minHeight: 32,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 0.4cqw 1.4cqw rgba(0,0,0,.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#14110d",
          fontSize: "max(12px, 2.4cqw)",
          fontWeight: 900,
          pointerEvents: "none",
        }}
      >
        ◀ ▶
      </span>
      {!estatico && (
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Comparar: ${aAntes} y ${aDespues}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", margin: 0, opacity: 0, cursor: "ew-resize", touchAction: "pan-y" }}
        />
      )}
    </div>
  );
}
