"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { opuesta, type Transicion } from "@/lib/transiciones";

/**
 * Pase de página tipo revista entre las páginas de una edición.
 * Disparadores: rueda al llegar al borde, arrastre con el ratón, gestos táctiles,
 * flechas del teclado y enlaces a otras páginas de la edición.
 * La animación gira una copia de la página actual sobre la ruta nueva.
 * La transición la define cada página (`transicion` = cómo ENTRA al avanzar;
 * al retroceder se usa la opuesta).
 */

export type FlowPage = { href: string; transicion: Transicion; titulo: string };

const WHEEL_THRESHOLD = 220; // desplazamiento acumulado para pasar de página
const EDGE_DWELL = 350; // ms que hay que estar en el borde antes de contar
const COMMIT_ANGLE = 45; // grados mínimos al soltar el arrastre
const MAX_DRAG_ANGLE = 170;
const SWIPE_FADE_PX = 80; // arrastre mínimo para transiciones sin seguimiento en vivo

type Geo = {
  origin: string;
  rot: (a: number) => string;
  back: string;
  grad: string;
  vertical: boolean;
  /** "end": la hoja ocupa [0, borde]; "start": ocupa [borde, tamaño]. */
  free: "end" | "start";
};

const GEO: Record<Exclude<Transicion, "fundido">, Geo> = {
  izquierda: { origin: "0% 50%", rot: (a) => `rotateY(${-a}deg)`, back: "rotateY(180deg)", grad: "to right", vertical: false, free: "end" },
  derecha: { origin: "100% 50%", rot: (a) => `rotateY(${a}deg)`, back: "rotateY(180deg)", grad: "to left", vertical: false, free: "start" },
  arriba: { origin: "50% 0%", rot: (a) => `rotateX(${a}deg)`, back: "rotateX(180deg)", grad: "to bottom", vertical: true, free: "end" },
  abajo: { origin: "50% 100%", rot: (a) => `rotateX(${-a}deg)`, back: "rotateX(180deg)", grad: "to top", vertical: true, free: "start" },
};

type Turn = {
  kind: Transicion;
  geo: Geo | null;
  target: string;
  vw: number;
  vh: number;
  overlay: HTMLDivElement;
  leaf: HTMLDivElement;
  dim: HTMLDivElement;
  shade: HTMLDivElement;
  underlay: HTMLDivElement;
  angle: number;
  committed: boolean;
  started: boolean;
  animDone: boolean;
  pathDone: boolean;
  startAnim: () => void;
  timers: number[];
  raf: number;
};

const ink = "28,24,20";

// Giro en curso (solo hay uno a la vez).
let current: Turn | null = null;

function cleanup(t: Turn) {
  cancelAnimationFrame(t.raf);
  t.timers.forEach(clearTimeout);
  t.overlay.remove();
  if (current === t) current = null;
}

function el(styles: Partial<CSSStyleDeclaration>) {
  const node = document.createElement("div");
  Object.assign(node.style, styles);
  return node;
}

function buildTurn(kind: Transicion, forward: boolean, target: string, label: string): Turn {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const geo = kind === "fundido" ? null : GEO[kind];

  const overlay = el({
    position: "fixed",
    top: "0",
    left: "0",
    width: `${vw}px`,
    height: `${vh}px`,
    zIndex: "9999",
    overflow: "hidden",
    perspective: "2400px",
  });
  overlay.setAttribute("data-pageflow", "");
  overlay.setAttribute("aria-hidden", "true");

  // Fondo visible mientras se arrastra, antes de que cargue la página nueva.
  const underlay = el({
    position: "absolute",
    inset: "0",
    background: "var(--paper-deep)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    color: "var(--ink)",
  });
  const small = document.createElement("span");
  small.textContent = forward ? "Siguiente página" : "Página anterior";
  small.style.cssText =
    "font:700 0.7rem var(--font-sans);letter-spacing:.18em;text-transform:uppercase;opacity:.6";
  const big = document.createElement("span");
  big.textContent = label;
  big.style.cssText =
    "font-family:var(--font-display);font-size:clamp(2rem,6vw,4rem);font-weight:900;font-style:italic;text-align:center;padding:0 1.5rem";
  underlay.append(small, big);

  // Sombra proyectada sobre la página de abajo, junto al borde libre.
  const shade = el({
    position: "absolute",
    opacity: "0",
    ...(geo?.vertical
      ? { left: "0", right: "0", height: "22%" }
      : { top: "0", bottom: "0", width: "22%" }),
    background: `linear-gradient(${geo?.grad ?? "to right"}, rgba(${ink},.4), rgba(${ink},0))`,
  });

  const leaf = el({
    position: "absolute",
    inset: "0",
    transformStyle: "preserve-3d",
    transformOrigin: geo?.origin ?? "50% 50%",
    willChange: "transform, opacity",
  });

  // Cara frontal: copia de lo que se ve ahora.
  const front = el({
    position: "absolute",
    inset: "0",
    overflow: "hidden",
    background: "var(--paper)",
    backfaceVisibility: "hidden",
  });
  const wrap = el({
    position: "absolute",
    top: "0",
    left: "0",
    width: `${vw}px`,
    transform: `translateY(${-window.scrollY}px)`,
    fontFamily: "var(--font-serif)",
    color: "var(--ink)",
    pointerEvents: "none",
  });
  Array.from(document.body.children).forEach((child) => {
    const tag = child.tagName.toLowerCase();
    if (
      child.hasAttribute("data-pageflow") ||
      child.hasAttribute("hidden") ||
      tag === "script" ||
      tag.includes("-")
    )
      return;
    wrap.appendChild(child.cloneNode(true));
  });
  const dim = el({
    position: "absolute",
    inset: "0",
    opacity: "0",
    pointerEvents: "none",
    background: `linear-gradient(${geo?.grad ?? "to right"}, rgba(${ink},.05), rgba(${ink},.55))`,
  });
  front.append(wrap, dim);

  // Reverso: papel liso con líneas tenues.
  const back = el({
    position: "absolute",
    inset: "0",
    transform: geo?.back ?? "none",
    backfaceVisibility: "hidden",
    background: `repeating-linear-gradient(0deg, rgba(${ink},.05) 0 1px, transparent 1px 28px), var(--paper-deep)`,
  });

  leaf.append(front, back);
  overlay.append(underlay, shade, leaf);
  document.body.appendChild(overlay);

  const turn: Turn = {
    kind,
    geo,
    target,
    vw,
    vh,
    overlay,
    leaf,
    dim,
    shade,
    underlay,
    angle: 0,
    committed: false,
    started: false,
    animDone: false,
    pathDone: false,
    startAnim: () => {},
    timers: [],
    raf: 0,
  };
  applyAngle(turn, 0);
  return turn;
}

function applyAngle(t: Turn, angle: number) {
  t.angle = angle;
  if (!t.geo) {
    // Fundido: la copia se desvanece sobre la página nueva.
    t.leaf.style.opacity = String(Math.max(0, 1 - angle / 180));
    return;
  }
  const rad = (angle * Math.PI) / 180;
  const g = t.geo;
  t.leaf.style.transform = g.rot(angle);
  t.dim.style.opacity = String(Math.sin(Math.min(rad, Math.PI / 2)));

  const size = g.vertical ? t.vh : t.vw;
  const edge = g.free === "end" ? size * Math.cos(rad) : size - size * Math.cos(rad);
  const extent = size * 0.22;
  const pos = `${g.free === "end" ? edge : edge - extent}px`;
  if (g.vertical) t.shade.style.top = pos;
  else t.shade.style.left = pos;
  t.shade.style.opacity = String(Math.max(0, Math.sin(rad)) * 0.9);
}

function animateAngle(t: Turn, from: number, to: number, done: () => void) {
  const ms = 140 + (300 * Math.abs(to - from)) / 180;
  const start = performance.now();
  const ease = (x: number) => 1 - Math.pow(1 - x, 2.2); // arranque inmediato, frena al final
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    applyAngle(t, from + (to - from) * ease(p));
    if (p < 1) t.raf = requestAnimationFrame(step);
    else done();
  };
  t.raf = requestAnimationFrame(step);
}

export default function PageFlow({ pages }: { pages: FlowPage[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const pathRef = useRef(pathname);
  const edges = useRef<{ top: number | null; bottom: number | null }>({ top: null, bottom: null });
  const hintRef = useRef<HTMLDivElement>(null);
  const hintText = useRef<HTMLParagraphElement>(null);
  const hintBar = useRef<HTMLDivElement>(null);

  function refreshEdges() {
    const now = performance.now();
    const doc = document.documentElement;
    const atTop = window.scrollY <= 1;
    const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
    edges.current.top = atTop ? (edges.current.top ?? now) : null;
    edges.current.bottom = atBottom ? (edges.current.bottom ?? now) : null;
  }

  // Cuando la ruta nueva ya está pintada: subir al inicio y destapar la página real.
  useEffect(() => {
    pathRef.current = pathname;
    const t = current;
    if (t && pathname === t.target && !t.pathDone) {
      window.scrollTo({ top: 0, behavior: "instant" });
      t.pathDone = true;
      t.underlay.style.display = "none";
      if (t.committed && !t.started) t.startAnim();
      if (t.animDone) cleanup(t);
    }
    edges.current = { top: null, bottom: null };
    refreshEdges();

    // Precarga las páginas contiguas para que el giro no espere a la red.
    const idx = pagesRef.current.findIndex((p) => p.href === pathname);
    if (idx >= 0) {
      [pagesRef.current[idx - 1], pagesRef.current[idx + 1]]
        .filter(Boolean)
        .forEach((p) => router.prefetch(p.href));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // En celular no hay giro de hoja: se lee con scroll continuo (FlujoMovil).
  const [movil, setMovil] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setMovil(mq.matches);
    const alCambiar = () => setMovil(mq.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  useEffect(() => {
    if (movil) return;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const indexNow = () => pagesRef.current.findIndex((p) => p.href === pathRef.current);

    /** Transición al ir de `from` a `to`: la de la página de destino, o la opuesta al volver. */
    const plan = (from: number, to: number) => {
      const ps = pagesRef.current;
      if (from < 0 || !ps[to] || from === to) return null;
      const forward = to > from;
      return {
        forward,
        target: ps[to].href,
        label: ps[to].titulo,
        kind: forward ? ps[to].transicion : opuesta(ps[from].transicion),
      };
    };

    function begin(kind: Transicion, forward: boolean, target: string, label: string) {
      const t = buildTurn(kind, forward, target, label);
      current = t;
      return t;
    }

    function commit(t: Turn, immediate: boolean) {
      t.committed = true;
      router.push(t.target);
      t.startAnim = () => {
        if (t.started) return;
        t.started = true;
        animateAngle(t, t.angle, 180, () => {
          t.animDone = true;
          if (t.pathDone) cleanup(t);
        });
      };
      if (immediate || t.pathDone) t.startAnim();
      else t.timers.push(window.setTimeout(t.startAnim, 600));
      t.timers.push(window.setTimeout(() => cleanup(t), 5000));
    }

    function cancel(t: Turn) {
      animateAngle(t, t.angle, 0, () => cleanup(t));
      t.timers.push(window.setTimeout(() => cleanup(t), 1500));
    }

    /** Ir a la página `to` (índice) con su animación. */
    function go(to: number) {
      const from = indexNow();
      const p = plan(from, to);
      if (!p || current) return;
      if (reduced()) {
        router.push(p.target);
        return;
      }
      commit(begin(p.kind, p.forward, p.target, p.label), false);
    }

    function setHint(progress: number, dir: 1 | -1) {
      const box = hintRef.current;
      if (!box || !hintText.current || !hintBar.current) return;
      box.style.opacity = progress > 0 ? "1" : "0";
      if (progress <= 0) return;
      const dest = pagesRef.current[indexNow() + dir];
      if (!dest) return;
      hintText.current.textContent =
        dir === 1
          ? `Sigue desplazando para pasar a ${dest.titulo} →`
          : `← Sigue hacia arriba para volver a ${dest.titulo}`;
      box.style.top = dir === -1 ? "1rem" : "auto";
      box.style.bottom = dir === 1 ? "1.25rem" : "auto";
      hintBar.current.style.transform = `scaleX(${Math.min(1, progress)})`;
    }

    // --- Rueda ---
    let acc = 0;
    let lastWheel = 0;
    let idle = 0;
    const onWheel = (e: WheelEvent) => {
      const idx = indexNow();
      if (idx < 0 || current) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      const now = performance.now();
      if (now - lastWheel > 700) acc = 0;
      lastWheel = now;

      const ps = pagesRef.current;
      let dir: 1 | -1 | 0 = 0;
      const { top, bottom } = edges.current;
      if (dy > 0 && bottom !== null && now - bottom > EDGE_DWELL && ps[idx + 1]) dir = 1;
      else if (dy < 0 && top !== null && now - top > EDGE_DWELL && ps[idx - 1]) dir = -1;

      if (!dir) {
        acc = 0;
        setHint(0, 1);
        return;
      }
      acc += Math.abs(dy);
      setHint(acc / WHEEL_THRESHOLD, dir);
      window.clearTimeout(idle);
      if (acc >= WHEEL_THRESHOLD) {
        acc = 0;
        setHint(0, dir);
        go(idx + dir);
      } else {
        idle = window.setTimeout(() => {
          acc = 0;
          setHint(0, dir);
        }, 700);
      }
    };

    // --- Teclado ---
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") go(indexNow() + 1);
      if (e.key === "ArrowLeft") go(indexNow() - 1);
    };

    // --- Enlaces a otras páginas de la edición ---
    let suppressClick = false;
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href");
      const idx = indexNow();
      if (!href || idx < 0) return;
      const to = pagesRef.current.findIndex((p) => p.href === href);
      if (to < 0 || to === idx) return;
      e.preventDefault();
      e.stopPropagation();
      go(to);
    };

    // --- Arrastre con el ratón ---
    type Drag = { x: number; y: number; t: Turn | null; to: number; live: boolean; dx: number };
    let drag: Drag | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || current || indexNow() < 0) return;
      const target = e.target as Element | null;
      if (target?.closest("a,button,input,textarea,select,label,summary,[contenteditable]")) return;
      drag = { x: e.clientX, y: e.clientY, t: null, to: -1, live: false, dx: 0 };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.dx = dx;
      if (drag.to < 0) {
        if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
          drag = null; // es un desplazamiento vertical, no un giro
          return;
        }
        if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

        // Arrastrar a la izquierda sigue una hoja con bisagra izquierda; a la derecha, bisagra derecha.
        const idx = indexNow();
        const want: Transicion = dx < 0 ? "izquierda" : "derecha";
        const fwd = plan(idx, idx + 1);
        const bwd = plan(idx, idx - 1);
        let choice: { to: number; p: NonNullable<typeof fwd>; live: boolean } | null = null;
        if (fwd && fwd.kind === want) choice = { to: idx + 1, p: fwd, live: true };
        else if (bwd && bwd.kind === want) choice = { to: idx - 1, p: bwd, live: true };
        else if (dx < 0 && fwd) choice = { to: idx + 1, p: fwd, live: false };
        else if (dx > 0 && bwd) choice = { to: idx - 1, p: bwd, live: false };
        if (!choice) {
          drag = null;
          return;
        }
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
        drag.to = choice.to;
        drag.live = choice.live;
        if (choice.live) drag.t = begin(choice.p.kind, choice.p.forward, choice.p.target, choice.p.label);
      }
      if (drag.t) {
        const along = drag.t.kind === "izquierda" ? -dx : dx;
        const ratio = Math.max(0, Math.min(1, along / (drag.t.vw * 0.7)));
        applyAngle(drag.t, ratio * MAX_DRAG_ANGLE);
      }
    };
    const onUp = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (d.to < 0) return;
      suppressClick = true;
      window.setTimeout(() => (suppressClick = false), 50);
      if (d.t) {
        if (d.t.angle > COMMIT_ANGLE) commit(d.t, true);
        else cancel(d.t);
      } else if (Math.abs(d.dx) > SWIPE_FADE_PX) {
        go(d.to);
      }
    };

    // --- Táctil ---
    let touch: { x: number; y: number; top: boolean; bottom: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      // Un deslizador (antes y después) usa el mismo gesto horizontal: no se toma como giro de página.
      if ((e.target as Element | null)?.closest?.("[data-sin-giro]")) {
        touch = null;
        return;
      }
      const p = e.touches[0];
      const doc = document.documentElement;
      touch = {
        x: p.clientX,
        y: p.clientY,
        top: window.scrollY <= 1,
        bottom: window.scrollY + window.innerHeight >= doc.scrollHeight - 2,
      };
    };
    const onTouchEnd = (e: TouchEvent) => {
      const idx = indexNow();
      if (!touch || idx < 0) return;
      const p = e.changedTouches[0];
      const dx = p.clientX - touch.x;
      const dy = p.clientY - touch.y;
      const start = touch;
      touch = null;
      if (Math.abs(dx) > 100 && Math.abs(dx) > Math.abs(dy) * 1.8) go(idx + (dx < 0 ? 1 : -1));
      else if (start.bottom && dy < -90) go(idx + 1);
      else if (start.top && dy > 90) go(idx - 1);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", refreshEdges, { passive: true });
    window.addEventListener("resize", refreshEdges);
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    refreshEdges();

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", refreshEdges);
      window.removeEventListener("resize", refreshEdges);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(idle);
      if (current) cleanup(current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, movil]);

  return (
    <div
      ref={hintRef}
      data-pageflow
      aria-hidden
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center opacity-0 transition-opacity duration-200"
      style={{ bottom: "1.25rem" }}
    >
      <div className="bg-ink px-4 py-2 text-paper">
        <p ref={hintText} className="kicker" />
        <div className="mt-2 h-0.5 bg-paper/25">
          <div ref={hintBar} className="h-full origin-left bg-ocre" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </div>
  );
}
