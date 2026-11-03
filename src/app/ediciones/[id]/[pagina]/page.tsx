import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLANTILLA_COMPONENTES } from "@/components/plantillas";
import { etiqueta, getEdicion, getEdiciones } from "@/lib/ediciones";

export function generateStaticParams() {
  return getEdiciones().flatMap((ed) =>
    ed.paginas.map((_, i) => ({ id: ed.id, pagina: String(i + 1) })),
  );
}

type Props = { params: Promise<{ id: string; pagina: string }> };

function cargar(id: string, pagina: string) {
  const ed = getEdicion(id);
  const n = Number(pagina);
  if (!ed || !Number.isInteger(n) || n < 1 || n > ed.paginas.length) return null;
  return { ed, n, pagina: ed.paginas[n - 1] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, pagina } = await params;
  const datos = cargar(id, pagina);
  if (!datos) return {};
  // Al compartir el enlace: en la portada, el tema de la edición; en las demás páginas, su título y el tema.
  const { ed, n, pagina: p } = datos;
  const titulo = n === 1 ? `${ed.tema} — ACOM-Di N.º ${ed.numero}` : `${etiqueta(p)} — ${ed.tema} (ACOM-Di N.º ${ed.numero})`;
  const descripcion = p.bajada || `Edición N.º ${ed.numero} de ACOM-Di, la revista digital de Acámbaro: ${ed.tema}. Se hojea como una revista, en cualquier pantalla.`;
  return {
    title: `${etiqueta(p)} — Acámbaro N.º ${ed.numero}`,
    description: p.bajada,
    openGraph: { type: "article", title: titulo, description: descripcion, siteName: "ACOM-Di · Revista de Acámbaro", locale: "es_MX" },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion },
  };
}

export default async function PaginaEdicion({ params }: Props) {
  const { id, pagina } = await params;
  const datos = cargar(id, pagina);
  if (!datos) notFound();

  const Plantilla = PLANTILLA_COMPONENTES[datos.pagina.plantilla];
  return <Plantilla {...datos} />;
}
