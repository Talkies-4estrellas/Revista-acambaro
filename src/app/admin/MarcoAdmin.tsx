"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { IconoSvg } from "@/components/Lienzo";
import BuscadorRapido, { type SeccionRapida } from "./BuscadorRapido";

type Enlace = { texto: string; href: string; externo?: boolean };
type Grupo = { clave: string; texto: string; icono: string; href: string; hijos?: Enlace[] };

/** El menú lateral: cada grupo abre su página y, con la flecha, sus submenús. */
const MENU: Grupo[] = [
  { clave: "inicio", texto: "Inicio", icono: "house", href: "/admin" },
  {
    clave: "ediciones",
    texto: "Ediciones",
    icono: "newspaper",
    href: "/admin?f=todas#lista",
    hijos: [
      { texto: "Todas", href: "/admin?f=todas#lista" },
      { texto: "Publicadas", href: "/admin?f=publicada#lista" },
      { texto: "Programadas", href: "/admin?f=programada#lista" },
      { texto: "Borradores", href: "/admin?f=borrador#lista" },
      { texto: "⚠ Por revisar", href: "/admin?f=avisos#lista" },
      { texto: "● Sin subir", href: "/admin?f=sinSubir#lista" },
      { texto: "Muestras", href: "/admin?f=muestra#lista" },
      { texto: "+ Nueva edición", href: "/admin#nueva" },
      { texto: "⧉ Edición resumida", href: "/admin#resumen" },
    ],
  },
  { clave: "calendario", texto: "Calendario", icono: "calendar-days", href: "/admin/calendario" },
  {
    clave: "estadisticas",
    texto: "Estadísticas",
    icono: "target",
    href: "/admin/clics",
    hijos: [
      { texto: "Clics y vistas", href: "/admin/clics" },
      { texto: "Descargar CSV de clics", href: "/api/admin/clics", externo: true },
    ],
  },
  {
    clave: "newsletter",
    texto: "Newsletter",
    icono: "mail",
    href: "/admin/newsletter",
    hijos: [
      { texto: "Suscriptores", href: "/admin/newsletter#suscriptores" },
      { texto: "Correo de la edición", href: "/admin/newsletter#correo" },
    ],
  },
  {
    clave: "anunciantes",
    texto: "Anunciantes",
    icono: "megaphone",
    href: "/admin/anunciantes",
    hijos: [
      { texto: "Todos", href: "/admin/anunciantes" },
      { texto: "+ Nuevo anunciante", href: "/admin/anunciantes#nuevo" },
      { texto: "Páginas sin anunciante", href: "/admin/anunciantes#sin-anunciante" },
    ],
  },
  { clave: "cupones", texto: "Cupones AcambaGo", icono: "ticket", href: "/admin/cupones" },
  {
    clave: "medios",
    texto: "Medios",
    icono: "images",
    href: "/admin/medios",
    hijos: [
      { texto: "Biblioteca", href: "/admin/medios" },
      { texto: "Sin uso", href: "/admin/medios?f=sinUso" },
      { texto: "Pesados", href: "/admin/medios?f=pesados" },
    ],
  },
  {
    clave: "papelera",
    texto: "Papelera",
    icono: "papelera",
    href: "/admin/papelera",
    hijos: [
      { texto: "Ediciones borradas", href: "/admin/papelera#ediciones" },
      { texto: "Fotos y videos", href: "/admin/papelera#medios" },
    ],
  },
  {
    clave: "sitio",
    texto: "Sitio público",
    icono: "globe",
    href: "/",
    hijos: [
      { texto: "Portada ↗", href: "/", externo: true },
      { texto: "Todas las ediciones ↗", href: "/ediciones", externo: true },
      { texto: "Bienvenida ↗", href: "/bienvenida", externo: true },
      { texto: "Buscar ↗", href: "/buscar", externo: true },
    ],
  },
  { clave: "ajustes", texto: "Ajustes", icono: "ajustes", href: "/admin/ajustes" },
];

/** Abre «Nueva edición» o «Edición resumida» en la página del panel (si ya está abierta; si no, lo hace el # al llegar). */
/** Todo lo del menú lateral, para el buscador rápido (Ctrl+K). */
const SECCIONES_RAPIDAS: SeccionRapida[] = [
  ...new Map(
    MENU.flatMap((g): SeccionRapida[] =>
      g.hijos
        ? [...(g.clave === "sitio" ? [] : [{ texto: g.texto, grupo: "Sección del panel", href: g.href }]), ...g.hijos.map((h) => ({ texto: h.texto, grupo: g.texto, href: h.href, externo: h.externo }))]
        : [{ texto: g.texto, grupo: "Sección del panel", href: g.href }],
    ).map((s) => [s.href, s]),
  ).values(),
];

const avisarPanel = (href: string) => {
  const frag = href.split("#")[1];
  if (frag === "nueva" || frag === "resumen") window.dispatchEvent(new CustomEvent("acomdi:panel", { detail: frag }));
};

const TITULOS: Record<string, string> = { "/admin": "Ediciones", "/admin/clics": "Estadísticas", "/admin/newsletter": "Newsletter", "/admin/anunciantes": "Anunciantes", "/admin/cupones": "Cupones de AcambaGo", "/admin/medios": "Medios", "/admin/papelera": "Papelera", "/admin/calendario": "Calendario", "/admin/ajustes": "Ajustes" };
/** Grupos que el usuario abrió o cerró a mano (se recuerda en el navegador). Sin elegir, solo está abierto el de la página actual. */
/** Engrane (tampoco está en el catálogo de iconos). Trazo de Lucide (ISC). */
function IconoAjustes({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const ELEGIDOS = "acomdi-admin-menu-abiertos";

/** Bote de basura (el catálogo de iconos no tiene uno; la «x» parecía el logo de X). Trazo de Lucide (ISC). */
function IconoPapelera({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );
}

/**
 * Marco del panel: barra de arriba (menú, logo, sección actual, acciones) y menú lateral con submenús.
 * El editor de una edición (/admin/<id>) ocupa toda la pantalla y no lo lleva.
 */
export default function MarcoAdmin({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const params = useSearchParams();
  const [abiertoMovil, setAbiertoMovil] = useState(false);
  const [elegidos, setElegidos] = useState<Record<string, boolean>>({});
  const [hash, setHash] = useState("");

  useEffect(() => {
    try {
      setElegidos(JSON.parse(localStorage.getItem(ELEGIDOS) ?? "{}"));
    } catch {}
    const leer = () => setHash(window.location.hash);
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, []);
  // Al cambiar de página se cierra el menú del celular.
  useEffect(() => setAbiertoMovil(false), [ruta, params]);

  const conMarco = ruta in TITULOS;
  if (!conMarco) return <>{children}</>;

  // Por defecto los submenús están cerrados, salvo el del grupo de la página en la que se está.
  const grupoDeRuta = MENU.find((g) => g.clave !== "inicio" && g.clave !== "sitio" && g.href.split(/[?#]/)[0] === ruta)?.clave;
  const estaAbierto = (clave: string) => elegidos[clave] ?? clave === grupoDeRuta;
  const alternarGrupo = (clave: string) =>
    setElegidos((e) => {
      const nuevo = { ...e, [clave]: !(e[clave] ?? clave === grupoDeRuta) };
      try {
        localStorage.setItem(ELEGIDOS, JSON.stringify(nuevo));
      } catch {}
      return nuevo;
    });

  const activo = (href: string) => {
    const [base, frag] = href.split("#");
    const [camino, q] = base.split("?");
    if (camino !== ruta) return false;
    if (q) return params.get("f") === new URLSearchParams(q).get("f");
    if (frag) return hash === `#${frag}`;
    return !params.has("f") && !hash;
  };
  const grupoActivo = (g: Grupo) => (g.clave === "inicio" ? ruta === "/admin" && !params.has("f") && !hash : g.clave === "sitio" ? false : g.href.split("?")[0].split("#")[0] === ruta && (g.clave !== "ediciones" || params.has("f") || !!hash));

  const menu = (
    <nav aria-label="Menú del panel" className="font-sans space-y-1 text-sm">
      {MENU.map((g) => {
        const abierto = estaAbierto(g.clave);
        const act = grupoActivo(g);
        return (
          <div key={g.clave}>
            <div className={`flex items-center rounded-lg ${act ? "bg-ink text-paper" : "hover:bg-ink/[0.07]"}`}>
              <Link
                href={g.href}
                target={g.clave === "sitio" ? "_blank" : undefined}
                className="flex flex-1 items-center gap-3 px-3 py-2 font-semibold"
                aria-current={act ? "page" : undefined}
              >
                {g.icono === "papelera" ? (
                  <IconoPapelera className="h-[1.1rem] w-[1.1rem] shrink-0" />
                ) : g.icono === "ajustes" ? (
                  <IconoAjustes className="h-[1.1rem] w-[1.1rem] shrink-0" />
                ) : (
                  <IconoSvg icono={g.icono} color={act ? "papel" : "tinta"} trazo={1.8} className="h-[1.1rem] w-[1.1rem] shrink-0" />
                )}
                {g.texto}
              </Link>
              {g.hijos && (
                <button
                  type="button"
                  onClick={() => alternarGrupo(g.clave)}
                  aria-expanded={abierto}
                  aria-label={`${abierto ? "Plegar" : "Desplegar"} ${g.texto}`}
                  className="grid h-9 w-9 place-items-center rounded-lg opacity-70 hover:opacity-100"
                >
                  <IconoSvg icono="chevron-down" color={act ? "papel" : "tinta"} trazo={2} className={`h-4 w-4 transition-transform ${abierto ? "" : "-rotate-90"}`} />
                </button>
              )}
            </div>
            {g.hijos && abierto && (
              <ul className="mb-2 ml-[1.35rem] mt-1 space-y-0.5 border-l border-ink/15 pl-3">
                {g.hijos.map((h) => {
                  const a = activo(h.href);
                  const cls = `block rounded-md px-2.5 py-1.5 ${a ? "bg-terracota/15 font-bold text-terracota" : "text-ink-soft hover:bg-ink/[0.06] hover:text-ink"}`;
                  return (
                    <li key={h.href}>
                      {h.externo ? (
                        <a href={h.href} target={h.href.startsWith("/api/") ? undefined : "_blank"} rel="noreferrer" className={cls}>
                          {h.texto}
                        </a>
                      ) : (
                        <Link
                          href={h.href}
                          // «Nueva edición» y «Edición resumida» se abren con un aviso directo si ya se está en el panel.
                          onClick={() => avisarPanel(h.href)}
                          className={cls}
                        >
                          {h.texto}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Barra de arriba */}
      <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setAbiertoMovil((v) => !v)}
            aria-expanded={abiertoMovil}
            aria-label="Abrir el menú"
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-ink/[0.07] lg:hidden"
          >
            <span aria-hidden className="text-xl leading-none">☰</span>
          </button>
          <Link href="/admin" aria-label="Inicio del panel" className="flex items-center gap-2">
            <Logo alt="ACOM-Di" className="h-8 w-auto" />
          </Link>
          <span className="font-sans hidden items-center gap-2 text-sm text-ink-soft sm:flex">
            <span aria-hidden>/</span>
            <span className="font-semibold text-ink">{TITULOS[ruta] ?? "Panel"}</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <BuscadorRapido secciones={SECCIONES_RAPIDAS} alIr={avisarPanel} />
            <a href="/" target="_blank" rel="noreferrer" className="font-sans hidden rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-soft hover:bg-ink/[0.07] hover:text-ink sm:inline-block">
              Ver sitio ↗
            </a>
            <Link
              href="/admin#nueva"
              onClick={() => avisarPanel("/admin#nueva")}
              className="font-sans whitespace-nowrap bg-ink px-3 py-2 text-xs font-bold uppercase tracking-wider text-paper hover:bg-terracota"
            >
              + Nueva<span className="hidden sm:inline"> edición</span>
            </Link>
            <ThemeToggle className="!h-9 w-9 rounded-lg border border-ink/20" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Menú lateral (escritorio) */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-ink/15 px-3 py-5 lg:block">
          {menu}
          <p className="font-sans mt-6 px-3 text-[0.7rem] leading-relaxed text-ink-soft">Este panel solo existe en tu equipo. Para publicar: commit, push y desplegar.</p>
        </aside>

        {/* Menú lateral (celular): se desliza desde la izquierda */}
        {abiertoMovil && (
          <div className="fixed inset-0 top-14 z-30 lg:hidden">
            <button type="button" aria-label="Cerrar el menú" onClick={() => setAbiertoMovil(false)} className="absolute inset-0 bg-black/40" />
            <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto border-r border-ink/15 bg-paper px-3 py-5 shadow-2xl">{menu}</aside>
          </div>
        )}

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
