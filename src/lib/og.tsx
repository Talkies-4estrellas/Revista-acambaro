import fs from "node:fs";
import path from "node:path";
import type { Pagina } from "./esquema";

/**
 * Tarjetas para compartir (la imagen que sale al pegar un enlace en WhatsApp, Facebook, X…): 1200 × 630, foto a sangre con un
 * velo oscuro, logo, una línea pequeña arriba, el título grande y una línea de apoyo. Se dibujan con `next/og` (ImageResponse).
 */
export const TAMANO_OG = { width: 1200, height: 630 };

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Lee un archivo de /public (en el equipo o al compilar); si no está en disco (p. ej. en el servidor publicado), lo pide al sitio. */
async function leerPublico(src: string): Promise<Buffer | null> {
  const ruta = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
  try {
    if (!ruta.startsWith(path.join(process.cwd(), "public"))) return null;
    if (fs.existsSync(ruta)) return fs.readFileSync(ruta);
    const res = await fetch(new URL(src, BASE));
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** Foto lista para la tarjeta (JPEG 1200 × 630 recortada al centro), como data URI. Sin sharp, solo sirven JPEG y PNG tal cual. */
export async function fotoOg(src?: string, enfoque?: { x: number; y: number }): Promise<string | null> {
  if (!src) return null;
  const buf = await leerPublico(src);
  if (!buf) return null;
  try {
    const sharp = (await import("sharp")).default;
    const posicion = enfoque ? (enfoque.y < 35 ? "north" : enfoque.y > 65 ? "south" : "centre") : "centre";
    const jpg = await sharp(buf, { density: 144 }).rotate().resize({ ...TAMANO_OG, fit: "cover", position: posicion }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    const ext = path.extname(src).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return `data:image/jpeg;base64,${buf.toString("base64")}`;
    if (ext === ".png") return `data:image/png;base64,${buf.toString("base64")}`;
    return null;
  }
}

/** El logo claro (para ir sobre la foto oscurecida). */
export async function logoOg(): Promise<string | null> {
  const buf = await leerPublico("/brand/logo-claro.svg");
  return buf ? `data:image/svg+xml;base64,${buf.toString("base64")}` : null;
}

/** La foto más grande de una página de lienzo (la que mejor la representa). */
export function fotoPrincipal(p?: Pagina): { src: string; enfoque?: { x: number; y: number } } | undefined {
  if (!p || p.plantilla !== "lienzo") return undefined;
  const fotos = (p.elementos ?? []).filter(
    (e): e is Extract<typeof e, { tipo: "imagen" }> => e.tipo === "imagen" && typeof e.src === "string" && e.src.startsWith("/media/") && !/\.svg$/i.test(e.src),
  );
  const mayor = fotos.sort((a, b) => b.w * b.h - a.w * a.h)[0];
  return mayor?.src ? { src: mayor.src, enfoque: mayor.enfoque } : undefined;
}

/** La tarjeta. `foto` y `logo` son data URI (o null: entonces va el fondo de la marca). */
export function TarjetaOg({ foto, logo, kicker, titulo, apoyo }: { foto: string | null; logo: string | null; kicker: string; titulo: string; apoyo?: string }) {
  const largo = titulo.length;
  const tam = largo > 60 ? 52 : largo > 38 ? 64 : 78;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(135deg, #013f4a 0%, #035c40 60%, #49c59f 100%)" }}>
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
      )}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: "flex",
          background: foto ? "linear-gradient(90deg, rgba(1,30,36,0.92) 0%, rgba(1,30,36,0.72) 48%, rgba(1,30,36,0.15) 100%)" : "transparent",
        }}
      />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", width: 1200, height: 630 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt="" width={300} height={73} style={{ width: 300, height: 73 }} /> : <div style={{ color: "#f6efe0", fontSize: 40 }}>ACOM-Di</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <div style={{ display: "flex", color: "#49c59f", fontSize: 24, letterSpacing: 5, textTransform: "uppercase" }}>{kicker}</div>
          <div style={{ display: "flex", color: "#f6efe0", fontSize: tam, lineHeight: 1.05, marginTop: 14, letterSpacing: -1 }}>{titulo}</div>
          {apoyo && <div style={{ display: "flex", color: "#e2e8e4", fontSize: 28, lineHeight: 1.3, marginTop: 18 }}>{apoyo}</div>}
        </div>
        <div style={{ display: "flex", color: "#cfe8de", fontSize: 22, letterSpacing: 2 }}>Revista de Acámbaro · cultura, sabor y memoria</div>
      </div>
    </div>
  );
}

/**
 * Dibuja la tarjeta y la entrega en JPEG (unos 150 KB en lugar de 1 MB en PNG): WhatsApp a veces no muestra imágenes pesadas.
 * Sin sharp se entrega el PNG tal cual.
 */
export async function respuestaOg(tarjeta: React.ReactElement): Promise<Response> {
  const { ImageResponse } = await import("next/og");
  const png = Buffer.from(await new ImageResponse(tarjeta, TAMANO_OG).arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=3600" } });
  } catch {
    return new Response(new Uint8Array(png), { headers: { "content-type": "image/png" } });
  }
}
