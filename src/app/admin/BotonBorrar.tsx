"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnCls } from "@/components/admin/campos";
import { mensajeSimple } from "@/lib/errores-simples";

/**
 * Pide confirmación y borra una edición (va a content/papelera, se puede recuperar a mano). Devuelve el mensaje de error, o
 * null si se borró o se canceló. Lo usan el botón «Borrar» y el menú del clic derecho.
 */
export async function borrarEdicionConAviso(id: string, tema?: string, numero?: string): Promise<string | null> {
  const aviso = numero
    ? `¿Borrar la edición desactivada N.º ${numero} “${tema || id}”?

Ya se había publicado: su número quedará libre. El archivo pasa a content/papelera y se puede recuperar.`
    : `¿Borrar el borrador “${tema || id}”?

El archivo pasa a content/papelera y los números de los demás borradores se reacomodan.`;
  if (!confirm(aviso)) return null;
  try {
    const res = await fetch(`/api/admin/ediciones/${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
    return null;
  } catch (e) {
    return mensajeSimple(e, "No se pudo borrar");
  }
}

/** Borra un borrador (va a content/papelera, se puede recuperar a mano). Los números se reacomodan solos. */
export default function BotonBorrar({ id, tema, numero }: { id: string; tema?: string; numero?: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function borrar() {
    setCargando(true);
    setError(null);
    const fallo = await borrarEdicionConAviso(id, tema, numero);
    if (fallo) setError(fallo);
    else router.refresh();
    setCargando(false);
  }

  return (
    <>
      <button type="button" onClick={borrar} disabled={cargando} className={`${btnCls} !border-terracota !text-terracota hover:!bg-terracota hover:!text-paper disabled:opacity-40`} title="Borrar borrador">
        {cargando ? "…" : "Borrar"}
      </button>
      {error && <span role="alert" className="font-sans basis-full text-[0.7rem] normal-case text-terracota">{error}</span>}
    </>
  );
}
