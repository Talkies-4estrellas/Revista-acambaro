"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Su contenido sube y aparece al entrar en pantalla. Lo que ya se ve al cargar no se anima, y sin JavaScript o con
 * «reducir movimiento» todo se ve normal desde el principio.
 */
export default function Revelar({ children, className = "", retraso = 0 }: { children: ReactNode; className?: string; retraso?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.style.transition = `opacity 0.7s ease ${retraso}ms, transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) ${retraso}ms`;
        el.style.opacity = "";
        el.style.transform = "";
        obs.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [retraso]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
