import { AJUSTES, leerEnvLocal, ocultarValor } from "@/lib/ajustes";
import PanelAjustes, { type FilaAjuste } from "./PanelAjustes";

export const dynamic = "force-dynamic";

/** Ajustes: las variables de entorno de la revista en un solo lugar (qué hay, para qué sirve y, las seguras, cambiarlas). */
export default function Ajustes() {
  const archivo = leerEnvLocal();
  const filas: FilaAjuste[] = AJUSTES.map((a) => {
    const enArchivo = archivo[a.clave] ?? "";
    const cargado = process.env[a.clave] ?? "";
    return {
      clave: a.clave,
      nombre: a.nombre,
      ayuda: a.ayuda,
      ejemplo: a.ejemplo,
      editable: a.editable,
      ocultar: !!a.ocultar,
      donde: a.donde,
      // Los webhooks no se muestran enteros (ni se mandan al navegador).
      valor: a.ocultar ? "" : enArchivo,
      resumen: enArchivo ? (a.ocultar ? ocultarValor(enArchivo) : enArchivo) : "",
      definida: !!enArchivo,
      // Escrita en el archivo pero el servidor aún no la cargó (o al revés): hay que reiniciar «npm run dev».
      pendiente: enArchivo !== cargado,
    };
  });
  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="font-display text-5xl font-black italic">Ajustes</h1>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Las variables de la revista que antes se escribían a mano en <code>.env.local</code>. Ese archivo es solo de tu equipo: no se sube a GitHub. Para
        el sitio publicado hay que ponerlas también en <b>Vercel → Settings → Environment Variables</b> (con «Copiar para Vercel»).
      </p>
      <PanelAjustes filas={filas} />
    </main>
  );
}
