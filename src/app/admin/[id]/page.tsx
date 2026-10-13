import Link from "next/link";
import { notFound } from "next/navigation";
import Editor from "@/components/admin/Editor";
import { ID_RE, entradasNumeracion, leerCrudo, listarMedios } from "@/lib/admin";

export default async function EditarEdicion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id)) notFound();

  let datos;
  try {
    datos = leerCrudo(id);
  } catch (e) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-3xl font-black">No se pudo leer la edición “{id}”</h1>
        <p className="font-sans mt-3 text-sm text-terracota">{e instanceof Error ? e.message : String(e)}</p>
        <p className="font-sans mt-3 text-sm text-ink-soft">
          El archivo <code>content/ediciones/{id}.json</code> no es un JSON válido. Corrígelo a mano y recarga.
        </p>
        <Link href="/admin" className="font-sans mt-6 inline-block text-xs font-bold uppercase tracking-wider text-terracota hover:underline">
          ← Ediciones
        </Link>
      </main>
    );
  }
  if (!datos) notFound();

  if (datos.paginas.length === 0)
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-3xl font-black">La edición “{id}” no tiene páginas</h1>
        <p className="font-sans mt-3 text-sm text-ink-soft">Agrega al menos una página en el archivo JSON para poder editarla aquí.</p>
      </main>
    );

  const otras = entradasNumeracion().filter((e) => e.id !== id);
  return <Editor id={id} inicial={datos} mediosIniciales={listarMedios(id)} otras={otras} />;
}
