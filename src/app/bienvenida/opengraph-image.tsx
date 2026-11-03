import { TAMANO_OG, TarjetaOg, respuestaOg, fotoOg, logoOg } from "@/lib/og";

export const alt = "ACOM-Di: la revista digital de Acámbaro";
export const size = TAMANO_OG;
export const contentType = "image/jpeg";

/** Imagen al compartir la presentación: La Fidelita con el titular de la bienvenida. */
export default async function Imagen() {
  const [foto, logo] = await Promise.all([fotoOg("/media/05/fidelita.jpg"), logoOg()]);
  return respuestaOg(
    <TarjetaOg foto={foto} logo={logo} kicker="Te presentamos ACOM-Di" titulo="La revista digital de Acámbaro" apoyo="Historia, sabor, gente y paisajes, contados cada semana en páginas que se hojean." />,
  );
}
