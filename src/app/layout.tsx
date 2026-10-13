import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, Inter } from "next/font/google";
import { clasesFuentes } from "./fuentes";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  style: ["normal", "italic"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const descripcion = "Revista digital sobre la historia, la gastronomía, la gente y los paisajes de Acámbaro, Guanajuato.";

export const metadata: Metadata = {
  // Dirección pública del sitio (para que la imagen al compartir lleve dirección completa). Define NEXT_PUBLIC_SITE_URL al publicar.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Acámbaro — Revista de cultura, sabor y memoria",
  description: descripcion,
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "ACOM-Di · Revista de Acámbaro",
    title: "ACOM-Di · Revista de Acámbaro",
    description: descripcion,
  },
  twitter: { card: "summary_large_image", title: "ACOM-Di · Revista de Acámbaro", description: descripcion },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      // Extensiones del navegador (p. ej. Katalon) añaden atributos a <html> antes de hidratar.
      suppressHydrationWarning
      className={`${playfair.variable} ${sourceSerif.variable} ${inter.variable} ${clasesFuentes}`}
    >
      {/* Extensiones del navegador (p. ej. Katalon) añaden atributos a <body> antes de hidratar. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
