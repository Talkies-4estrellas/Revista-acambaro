import { etiqueta, getEdicion, mesAnio } from "@/lib/ediciones";
import { TAMANO_OG, TarjetaOg, respuestaOg, fotoOg, fotoPrincipal, logoOg } from "@/lib/og";

export const alt = "Página de ACOM-Di, Revista de Acámbaro";
export const size = TAMANO_OG;
export const contentType = "image/jpeg";

/**
 * Imagen al compartir una página de una edición: la foto principal de esa página (o la de la portada), el número y el título.
 * En la portada el título es el tema de la edición; en las demás, el de la página, con el tema debajo.
 */
export default async function Imagen({ params }: { params: Promise<{ id: string; pagina: string }> }) {
  const { id, pagina } = await params;
  const ed = getEdicion(id);
  const n = Number(pagina);
  const p = ed?.paginas[n - 1];
  const principal = fotoPrincipal(p) ?? fotoPrincipal(ed?.paginas[0]);
  const [foto, logo] = await Promise.all([fotoOg(principal?.src, principal?.enfoque), logoOg()]);
  const kicker = ed ? [ed.muestra ? "Edición de muestra" : `Edición N.º ${ed.numero}`, mesAnio(ed.fecha)].join(" · ") : "ACOM-Di";
  const portada = !p || n === 1;
  return respuestaOg(
    <TarjetaOg
      foto={foto}
      logo={logo}
      kicker={kicker}
      titulo={portada ? (ed?.tema ?? "Revista de Acámbaro") : etiqueta(p)}
      apoyo={portada ? undefined : `${ed?.tema ?? ""} · página ${n}`}
    />,
  );
}
