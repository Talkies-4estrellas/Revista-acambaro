"use client";

import { useRouter } from "next/navigation";
import { useMenuContextual, type ItemMenu } from "@/components/admin/MenuContextual";
import { borrarEdicionConAviso } from "./BotonBorrar";

/** Una fila de la lista de ediciones con menú de clic derecho (editar, ver, copiar el enlace, borrar un borrador). */
export default function FilaEdicion({
  id,
  tema,
  borrable,
  numeroDesactivada,
  conError,
  children,
}: {
  id: string;
  tema?: string;
  /** Solo los borradores y las desactivadas se pueden borrar. */
  borrable: boolean;
  numeroDesactivada?: string;
  conError: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { abrir, menu } = useMenuContextual();

  const copiar = (texto: string) => navigator.clipboard?.writeText(texto).catch(() => {});

  return (
    <li
      className="border-t border-ink py-4"
      onContextMenu={(e) => {
        const items: ItemMenu[] = [
          { texto: "Editar", icono: "✎", onClick: () => router.push(`/admin/${id}`) },
          ...(!conError ? [{ texto: "Ver en el sitio ↗", onClick: () => window.open(`/ediciones/${id}/1`, "_blank") } as ItemMenu] : []),
          { separador: true },
          ...(!conError ? [{ texto: "Copiar el enlace", onClick: () => copiar(`${window.location.origin}/ediciones/${id}/1`) } as ItemMenu] : []),
          { texto: "Copiar el identificador", onClick: () => copiar(id) },
          ...(borrable
            ? ([
                { separador: true },
                {
                  texto: "Borrar…",
                  icono: "🗑",
                  peligro: true,
                  onClick: async () => {
                    const error = await borrarEdicionConAviso(id, tema, numeroDesactivada);
                    if (error) window.alert(error);
                    else router.refresh();
                  },
                },
              ] as ItemMenu[])
            : []),
        ];
        abrir(e, items);
      }}
    >
      {children}
      {menu}
    </li>
  );
}
