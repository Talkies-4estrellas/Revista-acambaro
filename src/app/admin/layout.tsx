import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminPermitido } from "@/lib/admin";
import MarcoAdmin from "./MarcoAdmin";

export const metadata: Metadata = {
  title: "Panel — Acámbaro",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Solo disponible en desarrollo y desde esta misma máquina (ver lib/admin.ts).
  if (!adminPermitido((await headers()).get("host"))) notFound();
  // Barra de arriba y menú lateral en las secciones del panel (Ediciones, Calendario, Estadísticas, Newsletter, Anunciantes, Medios, Papelera, Ajustes);
  // el editor de una edición y el reporte para anunciantes van sin ellos.
  return (
    <div className="min-h-screen bg-paper">
      <Suspense>
        <MarcoAdmin>{children}</MarcoAdmin>
      </Suspense>
    </div>
  );
}
