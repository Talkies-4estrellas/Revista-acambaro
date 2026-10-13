import { redirect } from "next/navigation";
import { getEdiciones } from "@/lib/ediciones";

export function generateStaticParams() {
  return getEdiciones().map((ed) => ({ id: ed.id }));
}

export default async function Edicion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/ediciones/${id}/1`);
}
