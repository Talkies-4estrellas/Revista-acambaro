import { clienteAcambaGo, credencialesAcambaGo, leerCuponesAcambaGo, type CuponAcambaGo } from "@/lib/cupones-acambago";
import PanelCupones from "./PanelCupones";

export const dynamic = "force-dynamic";

/** Cupones de AcambaGo: se leen de la base del ecommerce y se actualizan en vivo. Solo lectura. */
export default async function Cupones() {
  const cred = credencialesAcambaGo();
  let cupones: CuponAcambaGo[] = [];
  let error: string | null = null;
  const leido = new Date().toISOString();
  if (cred) {
    try {
      cupones = await leerCuponesAcambaGo(clienteAcambaGo(cred.url, cred.clave));
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="font-display text-5xl font-black italic">Cupones de AcambaGo</h1>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Los cupones que crean los negocios en el ecommerce, tal como están en su base de datos. Aquí solo se ven: para crear, editar o borrar uno se
        hace en AcambaGo. La lista se actualiza sola cuando alguien agrega o cambia un cupón.
      </p>
      {cred ? (
        <PanelCupones iniciales={cupones} errorInicial={error} leido={leido} url={cred.url} clave={cred.clave} />
      ) : (
        <div className="font-sans mt-6 rounded-xl border border-ink/25 bg-paper-deep/40 p-5 text-sm">
          <p className="font-bold">Falta la conexión con AcambaGo.</p>
          <p className="mt-1 text-ink-soft">
            Agrega <code>ACAMBAGO_SUPABASE_URL</code> y <code>ACAMBAGO_SUPABASE_ANON_KEY</code> (la clave pública de AcambaGo) al archivo{" "}
            <code>.env.local</code> de la revista y reinicia el servidor.
          </p>
        </div>
      )}
    </main>
  );
}
