import Link from "next/link";
import { getEdiciones, estadoEdicion, etiqueta, mesAnio } from "@/lib/ediciones";
import { leerSuscriptores } from "@/lib/suscriptores";
import PanelNewsletter from "./PanelNewsletter";

export const dynamic = "force-dynamic";

export default function Newsletter() {
  const suscriptores = leerSuscriptores().map((s) => ({ email: s.email, fecha: s.fecha }));
  const ediciones = getEdiciones().map((e) => {
    const primera = e.paginas[0]?.elementos?.find((x) => x.tipo === "imagen" && x.src);
    return {
      id: e.id,
      numero: e.numero,
      tema: e.tema,
      periodo: mesAnio(e.fecha),
      estado: estadoEdicion(e),
      imagen: primera && primera.tipo === "imagen" ? primera.src : undefined,
      // Páginas con título propio (una página en blanco sin título no aporta nada a la lista).
      paginas: e.paginas
        .map((p, i) => ({ n: i + 1, titulo: p.titulo ?? (p.plantilla === "lienzo" ? "" : etiqueta(p)) }))
        .filter((p) => p.titulo && p.n > 1),
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/admin" className="font-sans text-xs font-bold uppercase tracking-wider text-terracota hover:underline">
        ← Ediciones
      </Link>
      <h1 className="font-display mt-2 text-5xl font-black italic">Newsletter</h1>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Los correos de quienes se suscriben desde el sitio (<code>/suscribirse</code> o el bloque de suscripción) se guardan en{" "}
        <code>content/suscriptores.json</code>. Aquí los ves, los exportas y preparas el correo de cada edición para enviarlo
        con tu herramienta de correo.
      </p>
      <PanelNewsletter suscriptores={suscriptores} ediciones={ediciones} />
    </main>
  );
}
