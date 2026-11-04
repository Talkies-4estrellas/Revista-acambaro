# ACOM-Di · Revista de Acámbaro

Revista digital en español sobre Acámbaro (Guanajuato). Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4.
Sin base de datos: las ediciones son archivos JSON en `content/ediciones/`. El panel `/admin` solo existe en local.

## Comandos
```
npm run dev       # servidor de desarrollo (el usuario lo mantiene en localhost:3000: no abrir otro ni tocar .next)
npm run build     # verifica tipos y compilación (para probar sin tocar .next: NEXT_DIST_DIR=.next-build npx next build, y borrar .next-build)
npx tsc --noEmit  # chequeo rápido de tipos
```

## Documentación (dónde va todo)
Toda la documentación va en **`Doc/`** (ver `Doc/memoria.md` para la convención completa):
- Sesión del día → `Doc/sesiones/sesion-DD-MM-YYYY.md`: crearla **al inicio** y completarla al final; nunca editar días anteriores.
- Índice de archivos → `Doc/indice.md` (actualizarlo al agregar archivos).
- Documentación técnica → `Doc/documentacion/documento.md` (actualizarla si cambia el modelo de datos o una función).
- Variables de entorno (solo nombres, sin valores) → `Doc/credenciales.md`.
- La guía para quien arma ediciones es `GUIA-EDICIONES.md` (raíz, porque el panel la menciona): actualizarla al cambiar el editor.
- **Commits:** el asistente solo hace `git commit` cuando el usuario lo pide, y entonces lo ejecuta él (`git add` archivo por archivo; el usuario
  lo revisa en GitKraken). **Nunca `git push`** sin que lo pida.

## Reglas del proyecto
- **Probar en 360 px** (teléfono real) además de escritorio; el celular tiene su propia columna (`movil: "apilar"` / `"escala"`).
- Las hojas de la revista tienen 800 de ancho y `alto` 1100 (más alto en cómics); los colores solo pueden ser de la paleta o hexadecimales.
- Los textos de la revista llevan **créditos** de toda foto, logo o arte de terceros (página de créditos). Descargar material de terceros
  solo con permiso explícito del usuario.
- Números de página: usar identificadores (`ancla`, `#ancla`, `{p:ancla:2}`, `{n:2}`) en vez de escribirlos a mano.
- Modo oscuro: las hojas de la revista se mantienen claras (`.paleta-clara`); el logo oscuro es el de AcambaGo.
- Idioma de la interfaz, textos y documentación: español.
- **No editar ediciones ya hechas** sin que el usuario lo pida: se mejoran las herramientas, no el contenido publicado.
- Los anuncios con negocios inventados (edición de modelismo, muestra de la bienvenida) son **de muestra a propósito**.
- Probar con ediciones **desechables** (p. ej. `zz-prueba-…`) y borrar después sus restos (`content/papelera`, `content/respaldos`).
- **No simular escenarios hipotéticos** del usuario («si llegamos a 100 ediciones») creando archivos en el proyecto sin preguntar:
  razonarlo o probarlo en memoria, en el navegador.
- Los archivos de `public/media` no se renombran (las ediciones los usan por su ruta); al optimizarlos, guardar el original en
  `content/respaldos/medios-originales/` (fuera de git).

## Estructura rápida
- `content/` datos · `public/brand` y `public/media` imágenes · `src/lib` modelo y lógica · `src/components` interfaz · `src/app` rutas.
  Detalle en `Doc/indice.md`.
- **Sitio público:** `/` portada, `/ediciones/<id>/<n>` lector (giro de página en PC, columna en celular), `/buscar`, `/suscribirse`,
  `/proyecto` y `/bienvenida` (presentación: `src/proxy.ts` manda ahí la primera visita a `/`, cookie `acomdi-bienvenida`).
- **Bienvenida:** el menú «Secciones» está en `src/components/MenuSecciones.tsx`.
- **Imagen para compartir:** `src/lib/og.tsx` + `opengraph-image.tsx` en `/bienvenida` y `/ediciones/[id]/[pagina]` (JPEG 1200 × 630,
  foto principal de la página y título). Al publicar hay que definir `NEXT_PUBLIC_SITE_URL`.
- **Edición de muestra:** `"muestra": true` en el JSON (hoy `muestra-bienvenida.json`): se abre por su dirección y se hojea en
  /bienvenida, pero no sale en archivo, buscador, inicio ni numeración, y no se publica.
- **Panel `/admin`** (solo local): `MarcoAdmin.tsx` (barra de arriba y menú lateral) en `admin/layout.tsx`; secciones Ediciones
  (resumen; lista con vistas compacta / con portada / portadas, páginas de resultados, «Ir a la N.º», mes, orden, buscador que
  también mira los títulos de las páginas —tecla «/»—, filtros `?f=`; avisos del revisor, «Publicación ▾», continuar, cambios sin
  subir; las portadas se piden al llegar a la pantalla con `PortadaPerezosa.tsx`), Estadísticas
  (`/admin/clics`), Calendario (`/admin/calendario`), Ajustes (`/admin/ajustes`: escribe `.env.local` con copia previa; las variables que abren el
  panel son solo lectura), Newsletter, Anunciantes (`/admin/anunciantes`, con reporte imprimible en `/admin/anunciantes/<id>/reporte`;
  datos privados en `content/anunciantes.json`), Medios (`/admin/medios`) y Papelera (`/admin/papelera`). El editor `/admin/<id>` va a pantalla
  completa (`#revisar` abre el revisor, `#p=N` una página). Lógica nueva en `src/lib/admin-extra.ts` y `src/lib/git-estado.ts`.
  Ids reservados para ediciones: clics, newsletter, medios, papelera, anunciantes, calendario, ajustes. El menú lateral abre por defecto solo el grupo
  de la página actual. Ctrl+K abre el buscador rápido (`BuscadorRapido.tsx`). Si sale un aviso de hidratación en el menú tras cambiarlo, suele ser el servidor de desarrollo con una
  versión vieja de la ruta: tocar `admin/layout.tsx` lo recompila (no reiniciar el servidor del usuario).
