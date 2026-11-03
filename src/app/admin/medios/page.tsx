import { bibliotecaMedios, listarEdicionesAdmin } from "@/lib/admin";
import { usoFueraDeEdiciones } from "@/lib/admin-extra";
import { textoUso } from "@/lib/medios-uso";
import PanelMedios, { type MedioFila } from "./PanelMedios";

/** Biblioteca de medios: todas las fotos y videos de /media, cuánto pesan, dónde se usan y cuáles no usa nadie. */
export default function Medios() {
  const temas = new Map(listarEdicionesAdmin().map((e) => [e.id, e.numero && !e.muestra ? `N.º ${e.numero} · ${e.tema ?? e.id}` : (e.tema ?? e.id)]));
  const fuera = usoFueraDeEdiciones();
  const medios: MedioFila[] = bibliotecaMedios().map((m) => ({
    src: m.src,
    carpeta: m.carpeta,
    nombre: m.nombre,
    bytes: m.bytes,
    tipo: m.tipo,
    usos: [
      ...m.uso.map((u) => ({ texto: `${temas.get(u.edicion) ?? u.edicion}${textoUso(u.paginas) ? ` · ${textoUso(u.paginas)}` : ""}`, href: `/admin/${u.edicion}${u.paginas.find((p) => p > 0) ? `#p=${u.paginas.find((p) => p > 0)}` : ""}` })),
      ...(fuera.get(m.src) ?? []).map((d) => ({ texto: d })),
    ],
  }));
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="font-display text-5xl font-black italic">Medios</h1>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Todas las fotos y videos de <code>public/media</code>. «Sin uso» son los que no aparecen en ninguna edición, ni en el sitio, ni en plantillas o
        «Mis elementos»: se pueden quitar (van a la Papelera y se pueden recuperar).
      </p>
      <PanelMedios medios={medios} />
    </main>
  );
}
