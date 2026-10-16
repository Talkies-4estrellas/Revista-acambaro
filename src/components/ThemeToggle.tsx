"use client";

import { useEffect, useState } from "react";

/** Alterna entre modo claro y oscuro; la elección se recuerda en el navegador (localStorage). */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [oscuro, setOscuro] = useState<boolean | null>(null);

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function alternar() {
    const siguiente = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", siguiente);
    try {
      localStorage.setItem("theme", siguiente ? "dark" : "light");
    } catch {
      /* modo privado: solo vale para esta visita */
    }
    setOscuro(siguiente);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className={`inline-flex h-8 w-8 items-center justify-center text-base leading-none hover:text-terracota ${className}`}
    >
      <span aria-hidden>{oscuro === null ? "◐" : oscuro ? "☀" : "☾"}</span>
    </button>
  );
}
