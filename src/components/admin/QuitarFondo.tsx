"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { quitarFondo } from "@/lib/quitar-fondo";
import { btnCls, MediosContext } from "./campos";

const LADO_PREVIA = 520; // lado mayor de la vista previa (px)
const LADO_FINAL = 2000; // lado mayor del archivo que se guarda (px)
const DAMERO = "repeating-conic-gradient(#d9d9d9 0% 25%, #fff 0% 50%) 50% / 16px 16px";

/** Carga la imagen y la dibuja en un canvas del tamaño pedido. */
async function cargarEnCanvas(src: string, lado: number): Promise<{ canvas: HTMLCanvasElement; ancho: number; alto: number }> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
  const ancho = Math.max(1, Math.round(img.naturalWidth * k));
  const alto = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  canvas.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0, ancho, alto);
  return { canvas, ancho, alto };
}

/**
 * Quita el fondo de color liso de una foto: se toca el color del fondo en la imagen, se ajusta la tolerancia y el suavizado viendo el resultado
 * sobre un damero, y al aplicar se guarda una copia PNG con transparencia (la foto original no se toca).
 */
export default function QuitarFondo({ src, onAplicar, onCerrar }: { src: string; onAplicar: (nuevaRuta: string) => void; onCerrar: () => void }) {
  const { subir } = useContext(MediosContext);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const original = useRef<ImageData | null>(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [color, setColor] = useState<[number, number, number]>([255, 255, 255]);
  const [tolerancia, setTolerancia] = useState(25);
  const [suavizado, setSuavizado] = useState(1);
  const [conectado, setConectado] = useState(true);
  const [quitado, setQuitado] = useState(0);

  // Carga la vista previa y toma por omisión el color de la esquina superior izquierda.
  useEffect(() => {
    let vivo = true;
    cargarEnCanvas(src, LADO_PREVIA)
      .then(({ canvas, ancho, alto }) => {
        if (!vivo) return;
        const datos = canvas.getContext("2d")!.getImageData(0, 0, ancho, alto);
        original.current = datos;
        setColor([datos.data[0], datos.data[1], datos.data[2]]);
        setListo(true);
      })
      .catch((e) => vivo && setError(e instanceof Error && /tainted|insecure|security/i.test(e.message) ? "Esta imagen viene de otro sitio y el navegador no deja leerla. Súbela primero a la revista." : "No se pudo abrir la imagen."));
    return () => {
      vivo = false;
    };
  }, [src]);

  // Vista previa en vivo (con una pequeña espera mientras se mueven los controles).
  useEffect(() => {
    const base = original.current;
    const c = lienzo.current;
    if (!listo || !base || !c) return;
    const t = setTimeout(() => {
      try {
        const copia = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
        setQuitado(quitarFondo(copia.data, base.width, base.height, { color, tolerancia, suavizado, conectado }));
        c.width = base.width;
        c.height = base.height;
        c.getContext("2d")!.putImageData(copia, 0, 0);
      } catch {
        setError("No se pudo procesar la imagen.");
      }
    }, 80);
    return () => clearTimeout(t);
  }, [listo, color, tolerancia, suavizado, conectado]);

  function elegirColor(e: React.MouseEvent<HTMLCanvasElement>) {
    const base = original.current;
    if (!base) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(base.width - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * base.width)));
    const y = Math.min(base.height - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * base.height)));
    const i = (y * base.width + x) * 4;
    setColor([base.data[i], base.data[i + 1], base.data[i + 2]]);
  }

  async function aplicar() {
    setTrabajando(true);
    setError("");
    try {
      const { canvas, ancho, alto } = await cargarEnCanvas(src, LADO_FINAL);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const datos = ctx.getImageData(0, 0, ancho, alto);
      // El suavizado se mide en la vista previa: se escala al tamaño final para que el borde se vea igual.
      const escala = Math.max(ancho, alto) / Math.max(original.current?.width ?? ancho, original.current?.height ?? alto);
      quitarFondo(datos.data, ancho, alto, { color, tolerancia, suavizado: suavizado * escala, conectado });
      ctx.putImageData(datos, 0, 0);
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("No se pudo crear la imagen.");
      const nombre = (decodeURIComponent(src.split("/").pop() ?? "foto").replace(/\.[^.]+$/, "") || "foto") + "-sin-fondo.png";
      onAplicar(await subir(new File([blob], nombre, { type: "image/png" })));
      onCerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la imagen.");
      setTrabajando(false);
    }
  }

  const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/60 p-3 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && !trabajando && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label="Quitar el fondo" className="w-full max-w-3xl border-2 border-ink bg-paper shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-ink/30 bg-paper-deep px-5 py-3">
          <h2 className="font-display text-2xl font-black">Quitar el fondo</h2>
          <button type="button" className={btnCls} onClick={onCerrar} disabled={trabajando}>
            ✕ Cerrar
          </button>
        </header>
        <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <div className="flex justify-center border border-ink/20 p-2" style={{ background: DAMERO }}>
              {!listo && !error && <p className="font-sans py-16 text-sm text-ink-soft">Cargando…</p>}
              <canvas ref={lienzo} onClick={elegirColor} className={listo ? "block max-h-[60vh] w-auto max-w-full cursor-crosshair" : "hidden"} aria-label="Vista previa: toca el color que quieres quitar" />
            </div>
            <p className="font-sans mt-2 text-[0.7rem] text-ink-soft">Toca en la imagen el color que quieres quitar. El damero muestra lo que quedará transparente.</p>
          </div>
          <div className="font-sans space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="block h-8 w-8 shrink-0 border border-ink/40" style={{ background: rgb }} aria-hidden />
              <span className="text-ink-soft">Color a quitar: {rgb}</span>
            </div>
            <label className="block">
              <span className="mb-1 block font-bold uppercase tracking-wide text-ink-soft">Tolerancia: {tolerancia}</span>
              <input type="range" min={1} max={80} value={tolerancia} onChange={(e) => setTolerancia(Number(e.target.value))} className="w-full accent-[#068562]" />
              <span className="text-[0.68rem] text-ink-soft">Más alta quita colores parecidos (sombras suaves, bordes grisáceos); demasiada se come la foto.</span>
            </label>
            <label className="block">
              <span className="mb-1 block font-bold uppercase tracking-wide text-ink-soft">Suavizado del borde: {suavizado} px</span>
              <input type="range" min={0} max={4} value={suavizado} onChange={(e) => setSuavizado(Number(e.target.value))} className="w-full accent-[#068562]" />
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 accent-[#068562]" checked={conectado} onChange={(e) => setConectado(e.target.checked)} />
              <span>Solo el fondo unido a los bordes (así no se borra, por ejemplo, el blanco de una camisa).</span>
            </label>
            {listo && <p className="text-ink-soft">Se vuelve transparente el {Math.round(quitado * 100)} % de la imagen.</p>}
            {error && (
              <p role="alert" className="border-l-4 border-terracota bg-terracota/10 px-2 py-1 text-terracota">
                {error}
              </p>
            )}
            <button type="button" className={`${btnCls} w-full !bg-ink !py-2 !text-paper`} disabled={!listo || trabajando} onClick={aplicar}>
              {trabajando ? "Guardando…" : "Quitar el fondo y usar esta imagen"}
            </button>
            <p className="text-[0.68rem] text-ink-soft">Se guarda una copia nueva («…-sin-fondo.png»); la foto original sigue en «Subidos». Funciona mejor con fondos de un solo color.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
