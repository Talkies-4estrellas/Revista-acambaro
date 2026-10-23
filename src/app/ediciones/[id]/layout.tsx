import { notFound } from "next/navigation";
import ContarVistas from "@/components/ContarVistas";
import PageFlow from "@/components/PageFlow";
import { etiqueta, getEdicion, getEdiciones, hrefPagina } from "@/lib/ediciones";

export function generateStaticParams() {
  return getEdiciones().map((ed) => ({ id: ed.id }));
}

export default async function EdicionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ed = getEdicion(id);
  if (!ed) notFound();

  const pages = ed.paginas.map((p, i) => ({
    href: hrefPagina(ed, i + 1),
    transicion: p.transicion,
    titulo: etiqueta(p),
  }));

  return (
    <>
      {children}
      <PageFlow pages={pages} />
      <ContarVistas edicion={ed.id} />
    </>
  );
}
