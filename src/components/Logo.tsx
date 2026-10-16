/* eslint-disable @next/next/no-img-element */
/** Logotipo con su versión clara para el modo oscuro (se alternan por CSS, sin parpadeo). */
export default function Logo({ className = "", alt = "ACOM-Di, Revista de Acámbaro" }: { className?: string; alt?: string }) {
  return (
    <>
      <img src="/brand/logo.svg" alt={alt} className={`${className} dark:hidden`} />
      <img src="/brand/logo-claro.svg" alt={alt} className={`${className} hidden dark:block`} />
    </>
  );
}
