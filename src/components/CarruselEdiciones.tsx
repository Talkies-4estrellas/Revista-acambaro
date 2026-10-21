"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Carrusel «cover flow» de las ediciones anteriores, solo para celular: la portada del centro se ve grande y al frente; las de los lados, más chicas,
 * atenuadas, giradas hacia dentro y algo encimadas. Se desliza con imán al centro y abajo hay puntos para ir a una portada.
 * Desde `sm` (640 px) no hace nada: la lista vuelve a ser la cuadrícula que le da `className`. Las portadas llegan ya dibujadas desde el servidor (`children`).
 */
export default function CarruselEdiciones({ children, className, etiqueta }: { children: ReactNode; className?: string; etiqueta?: string }) {
  const ol = useRef<HTMLOListElement>(null);
  const [activo, setActivo] = useState(0);
  const total = Children.count(children);

  useEffect(() => {
    const lista = ol.current;
    if (!lista) return;
    const ancho = window.matchMedia("(min-width: 640px)");
    let cuadro = 0;

    const pintar = () => {
      cuadro = 0;
      const items = Array.from(lista.children) as HTMLElement[];
      if (ancho.matches) {
        // Cuadrícula normal: se quita todo lo que puso el carrusel.
        lista.style.paddingLeft = lista.style.paddingRight = "";
        items.forEach((li) => {
          li.style.transform = li.style.opacity = li.style.zIndex = "";
          li.style.removeProperty("--pie");
        });
        return;
      }
      if (items.length === 0) return;
      // La primera y la última portada pueden quedar en el centro: el relleno de los lados es lo que sobra de una portada.
      const lado = Math.max(0, (lista.clientWidth - items[0].offsetWidth) / 2);
      lista.style.paddingLeft = lista.style.paddingRight = `${lado}px`;
      let mejor = 0;
      let mejorD = Infinity;
      items.forEach((li, i) => {
        const d = (li.offsetLeft - lista.scrollLeft + li.offsetWidth / 2 - lista.clientWidth / 2) / li.offsetWidth; // 0 = en el centro, ±1 = una portada de distancia
        const a = Math.min(Math.abs(d), 1);
        li.style.transform = `scale(${(1 - 0.2 * a).toFixed(3)}) rotateY(${(-Math.max(-1, Math.min(1, d)) * 32).toFixed(1)}deg)`;
        li.style.opacity = (1 - 0.5 * a).toFixed(3);
        li.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
        li.style.setProperty("--pie", Math.max(0, 1 - Math.abs(d) * 2.2).toFixed(2)); // el título solo se ve en la portada del centro
        if (Math.abs(d) < mejorD) {
          mejorD = Math.abs(d);
          mejor = i;
        }
      });
      setActivo(mejor);
    };
    const programar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    };

    pintar();
    lista.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar);
    ancho.addEventListener("change", programar);
    return () => {
      if (cuadro) cancelAnimationFrame(cuadro);
      lista.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
      ancho.removeEventListener("change", programar);
    };
  }, [total]);

  const ir = (i: number) => {
    const lista = ol.current;
    const li = lista?.children[i] as HTMLElement | undefined;
    if (!lista || !li) return;
    lista.scrollTo({ left: li.offsetLeft - (lista.clientWidth - li.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <>
      <ol ref={ol} className={`relative [perspective:900px] sm:[perspective:none] ${className ?? ""}`} aria-roledescription="carrusel" aria-label={etiqueta}>
        {children}
      </ol>
      {total > 1 && (
        <div className="mt-1 flex flex-wrap justify-center gap-2 sm:hidden" role="group" aria-label="Ir a una edición">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Edición ${i + 1} de ${total}`}
              aria-current={i === activo}
              className={`h-2 rounded-full transition-all ${i === activo ? "w-6 bg-terracota" : "w-2 bg-ink/30"}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
