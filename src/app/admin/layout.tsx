import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { adminPermitido } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Panel — Acámbaro",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Solo disponible en desarrollo y desde esta misma máquina (ver lib/admin.ts).
  if (!adminPermitido((await headers()).get("host"))) notFound();
  return <div className="min-h-screen bg-paper">{children}</div>;
}
