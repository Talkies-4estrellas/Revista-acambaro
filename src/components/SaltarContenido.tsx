"use client";

/**
 * Primer elemento al que llega el tabulador: lleva directo al contenido, sin recorrer toda la cabecera. Solo se ve al recibir el foco.
 * Busca el <main> al pulsar para no depender de un id: el scroll del celular puede tener varios en la misma pantalla.
 * data-pageflow lo deja fuera de la copia que PageFlow anima al girar la hoja.
 */
export default function SaltarContenido() {
  return (
    <a
      href="#contenido"
      data-pageflow
      onClick={(e) => {
        const main = document.querySelector("main");
        if (!main) return;
        e.preventDefault();
        main.tabIndex = -1;
        main.focus();
        main.scrollIntoView();
      }}
      className="font-sans sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-paper"
    >
      Saltar al contenido
    </a>
  );
}
