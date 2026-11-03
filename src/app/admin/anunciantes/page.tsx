import { getEdiciones } from "@/lib/ediciones";
import { leerAnunciantes, numerosDe, paginasDePublicidad } from "@/lib/anunciantes";
import { leerClics } from "@/lib/clics";
import { leerVistas } from "@/lib/vistas";
import LienzoVista from "@/components/Lienzo";
import PanelAnunciantes, { type FichaAnunciante, type PaginaElegible } from "./PanelAnunciantes";

/** Enlaces externos de una página (para sugerir cuáles son del anunciante). */
function enlacesDePagina(elementos: { enlace?: string | number }[] = []) {
  return [
    ...new Set(
      elementos
        .map((e) => (typeof e.enlace === "string" ? e.enlace : ""))
        .filter((u) => /^(https?:|mailto:|tel:)/i.test(u))
        .map((u) => u.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "").toLowerCase()),
    ),
  ].slice(0, 8);
}

/** Anunciantes: quién se anuncia, en qué páginas, cuándo vence y cómo le va (vistas, clics, tasa). Con reporte para mandarle. */
export default function Anunciantes() {
  const ediciones = getEdiciones();
  const paginas = paginasDePublicidad(ediciones);
  const vistas = leerVistas();
  const clics = leerClics();
  const anunciantes = leerAnunciantes();

  const fichas: FichaAnunciante[] = anunciantes.map((a) => ({ ...a, numeros: numerosDe(a, { vistas, clics, ediciones }) }));

  const asignadas = new Set(anunciantes.flatMap((a) => a.anuncios.map((x) => `${x.edicion}|${x.pagina}`)));
  const elegibles: PaginaElegible[] = paginas
    .filter((p) => !p.muestra)
    .map((p) => {
      const pag = ediciones.find((e) => e.id === p.edicion)?.paginas[p.pagina - 1];
      return {
        ...p,
        asignada: asignadas.has(`${p.edicion}|${p.pagina}`),
        enlaces: enlacesDePagina(pag?.elementos),
        miniatura:
          pag?.plantilla === "lienzo" ? (
            <div aria-hidden className="pointer-events-none overflow-hidden rounded-sm">
              <LienzoVista elementos={pag.elementos ?? []} fondo={pag.fondo} alto={pag.alto} edicionId={p.edicion} miniatura />
            </div>
          ) : null,
      };
    });

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="font-display text-5xl font-black italic">Anunciantes</h1>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Quién se anuncia, en qué páginas, hasta cuándo y cómo le va. Los números salen de las vistas y clics que ya registra la revista (solo en
        ediciones publicadas). Los datos se guardan en <code>content/anunciantes.json</code>, que es privado y no se sube a GitHub.
      </p>
      <PanelAnunciantes fichas={fichas} paginas={elegibles} />
    </main>
  );
}
