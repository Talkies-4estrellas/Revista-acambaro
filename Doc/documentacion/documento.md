# ACOM-Di · Revista de Acámbaro — Documentación técnica

## Qué es
Revista digital semanal sobre Acámbaro (Guanajuato). Se lee página por página como una revista (giro de página en escritorio, columna en
el celular). **Una sola persona arma cada edición** desde un panel local con editor de lienzo, sin escribir código. La versión
publicada (Vercel, privada por ahora) sirve como demo para atraer colaboradores y marcas.

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript.
- **Estilos:** Tailwind CSS v4 con variables CSS (`--paper`, `--ink`, `--terracota`…) y modo oscuro por clase `dark` en `<html>`.
- **Texto con formato en el editor:** TipTap.
- **Datos:** archivos JSON en `content/` (sin base de datos). El panel solo existe en la computadora de quien publica.
- **Deploy:** Vercel desde GitHub (`git push`); el panel de administración no se despliega.
- **Fuentes:** Playfair Display (títulos), Source Serif 4 (texto), Inter (interfaz) vía `next/font`.
- **Paleta (misma que AcambaGo):** `#068562` acento, `#013f4a`, `#49c59f`, fondo `#f1f5f9`, tinta `#1e293b`.

## Comandos
```
npm run dev     # servidor de desarrollo (en el equipo de quien publica se usa localhost:3000)
npm run build   # build de producción (verifica tipos y compilación)
npx tsc --noEmit
```

## Variables de entorno (opcionales)
Ver `credenciales.md`. Nombres usados en el código: `ADMIN_ENABLED`, `ADMIN_ALLOW_REMOTE`, `CLICS_WEBHOOK_URL`,
`SUSCRIPCION_WEBHOOK_URL`, `NEXT_PUBLIC_SITE_URL`.

---

## Modelo de datos (edición)
Archivo `content/ediciones/NN.json`:
```json
{ "fecha": "2026-11-02", "tema": "Los Azufres, Michoacán", "publicada": true, "numeroFijo": true, "paginas": [ … ] }
```
- **Número de edición:** automático (`lib/numeracion.ts`). Se asigna al publicar por primera vez, a continuación de la última
  publicada, y queda fijo aunque se desactive. Los borradores muestran el número previsto.
- **Página de lienzo:** `plantilla: "lienzo"`, hoja de 800 de ancho y `alto` (normal 1100; más alto para cómics), `fondo`, `titulo`,
  `seccion` (`"Publicidad"` marca anuncios: se excluyen de la búsqueda y el editor avisa de anuncios seguidos), `ancla`.
- **Elementos** (`texto`, `imagen`, `video`, `forma`, `icono`): `x, y, w, h, rot, opacidad`, `enlace`, `animacion`, `molde`, `movil`.
  Textos con `contenido` (tramos con negrita/cursiva/color) o `texto` plano; `fondo` + `relleno` dan un bloque de color.
- **Celular:** por página, `movil: "escala"` (toda la hoja reducida; bueno para anuncios) o `"apilar"` (columna de arriba abajo, con
  `ordenMovil`). Por elemento: `movil: "ocultar"` (no aparece en la columna) o `"solo"` (solo aparece en la columna; no se dibuja
  en la hoja de escritorio). Las fotos apaisadas (≥ 1.4) van a todo el ancho; los logos anchos van centrados a ~58 %.
- **Validación:** `lib/ediciones.ts` (`validarEdicion`). Los errores dicen página y campo. Los colores solo pueden ser de la paleta
  (`papel, papel2, tinta, tintaSuave, blanco, terracota, ocre, oliva, indigo`) o hexadecimales (no `rgba`).

## Números de página automáticos (identificadores)
- Cada página puede tener `ancla` (ej. `editorial`). Un enlace `"#editorial"` lleva a esa página aunque se mueva.
- En los textos: `{p:editorial}` → número de esa página; `{p:editorial:2}` → `03`; `{n}` / `{n:2}` → número de la propia página.
- Se resuelve **al leer** la edición (`resolverReferencias`); el archivo guarda las referencias. Un identificador inexistente
  lanza un error que lista los que hay. Las ediciones 14 y 15 ya usan esto en portada, índice y pies.

## Funciones del panel (`/admin`)
- **Editor de lienzo:** arrastrar elementos, inspector de propiedades, texto enriquecido, reglas/guías, imán, grupos, deshacer.
- **Plantillas** (▤): 6 iniciales, 10 de publicidad (incluye 3 collages de varias marcas), 3 de noticias y cómic, y las propias.
- **Revisor de diseño** (✓): datos (anuncios seguidos, enlaces `example.com`, textos de relleno, imágenes sin descripción) y
  medición visual por página en escritorio y celular (letra < 9.5 px, desborde horizontal, posibles choques de texto). Los choques
  son **«posibles»**: la medición dio falsos avisos en pruebas.
- **Armar edición resumida:** elegir y ordenar páginas de otra edición; `lib/resumen.ts` reacomoda el índice, la portada y los enlaces.
- **Orden en el celular**, **vista previa móvil**, publicación programada, numeración automática, clics y newsletter (ver guía).

## Publicidad y clics
Los enlaces externos de los elementos se miden (`/api/clic`, `content/clics.json`; opcional `CLICS_WEBHOOK_URL`). Los anuncios llevan
`seccion: "Publicidad"`. Las marcas de la edición 14 usan logos y fotos descargados de Wikimedia Commons (créditos en la página de
créditos); las marcas propias (AcambaGo, Erudito Galery, Josman/Fercadi) y sus textos de oferta son de ejemplo.

## Modo oscuro
Clase `dark` en `<html>` (script `next/script` en `layout.tsx`; elección en `localStorage.theme`, si no hay, la del sistema).
Las **hojas de la revista** siguen claras: `.paleta-clara` restaura la paleta clara dentro de ellas. El logo oscuro es el de AcambaGo.

## Lector
- Escritorio: las páginas se pasan con scroll/arrastre/flechas (`PageFlow`); celular: columna con navegación inferior.
- Contenedor `@container pagina (max-width: 640px)` decide escritorio vs celular por el ancho de la hoja, no de la ventana.
- Probar siempre a **360 px** (ancho real de un teléfono común).
