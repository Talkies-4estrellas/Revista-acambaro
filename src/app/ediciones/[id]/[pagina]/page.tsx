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
  return {
    title: `${etiqueta(datos.pagina)} — Acámbaro N.º ${datos.ed.numero}`,
    description: datos.pagina.bajada,
  };
}

export default async function PaginaEdicion({ params }: Props) {
  const { id, pagina } = await params;
  const datos = cargar(id, pagina);
  if (!datos) notFound();

  const Plantilla = PLANTILLA_COMPONENTES[datos.pagina.plantilla];
  return <Plantilla {...datos} />;
}
