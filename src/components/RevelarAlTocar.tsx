"use client";

import { useState, type ReactNode } from "react";

/**
 * Tapa un elemento hasta que el lector lo toca (la respuesta de una trivia, un dato curioso, un cupón…). El contenido sigue en la página
 * (los buscadores lo leen) pero queda oculto y fuera del orden de lectura mientras está tapado. Una vez revelado, se queda así.
 * Si el elemento es un enlace, tocar la tapa solo la quita: no navega.
 */
export default function RevelarAlTocar({ etiqueta, radio, children }: { etiqueta: string; radio?: string; children: ReactNode }) {
  const [visto, setVisto] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div aria-hidden={!visto} style={{ width: "100%", height: "100%", visibility: visto ? "visible" : "hidden" }}>
        {children}
      </div>
      <button
        type="button"
        tabIndex={visto ? -1 : 0}
        aria-hidden={visto}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setVisto(true);
        }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6em",
          padding: "0.5em 1em",
          border: 0,
          borderRadius: radio,
          background: "var(--terracota)",
          color: "#fff",
          fontFamily: "var(--font-sans, sans-serif)",
          fontWeight: 800,
          fontSize: "max(13px, 2.4cqw)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.2,
          cursor: "pointer",
          opacity: visto ? 0 : 1,
          pointerEvents: visto ? "none" : "auto",
          transition: "opacity .35s ease",
        }}
      >
        <span aria-hidden>👆</span>
        <span>{etiqueta}</span>
      </button>
    </div>
  );
}
