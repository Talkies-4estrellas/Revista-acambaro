# ACOM-Di · Revista de Acámbaro

Revista digital en español sobre Acámbaro (Guanajuato). Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4.
Sin base de datos: las ediciones son archivos JSON en `content/ediciones/`. El panel `/admin` solo existe en local.

## Comandos
```
npm run dev       # servidor de desarrollo (el usuario lo mantiene en localhost:3000: no abrir otro ni tocar .next)
npm run build     # verifica tipos y compilación
npx tsc --noEmit  # chequeo rápido de tipos
```

## Documentación (dónde va todo)
Toda la documentación va en **`Doc/`** (ver `Doc/memoria.md` para la convención completa):
- Sesión del día → `Doc/sesiones/sesion-DD-MM-YYYY.md`: crearla **al inicio** y completarla al final; nunca editar días anteriores.
- Índice de archivos → `Doc/indice.md` (actualizarlo al agregar archivos).
- Documentación técnica → `Doc/documentacion/documento.md` (actualizarla si cambia el modelo de datos o una función).
- Variables de entorno (solo nombres, sin valores) → `Doc/credenciales.md`.
- La guía para quien arma ediciones es `GUIA-EDICIONES.md` (raíz, porque el panel la menciona): actualizarla al cambiar el editor.
- **El asistente nunca hace `git commit` ni `git push`**: los hace el usuario.

## Reglas del proyecto
- **Probar en 360 px** (teléfono real) además de escritorio; el celular tiene su propia columna (`movil: "apilar"` / `"escala"`).
- Las hojas de la revista tienen 800 de ancho y `alto` 1100 (más alto en cómics); los colores solo pueden ser de la paleta o hexadecimales.
- Los textos de la revista llevan **créditos** de toda foto, logo o arte de terceros (página de créditos). Descargar material de terceros
  solo con permiso explícito del usuario.
- Números de página: usar identificadores (`ancla`, `#ancla`, `{p:ancla:2}`, `{n:2}`) en vez de escribirlos a mano.
- Modo oscuro: las hojas de la revista se mantienen claras (`.paleta-clara`); el logo oscuro es el de AcambaGo.
- Idioma de la interfaz, textos y documentación: español.

## Estructura rápida
- `content/` datos · `public/brand` y `public/media` imágenes · `src/lib` modelo y lógica · `src/components` interfaz · `src/app` rutas.
  Detalle en `Doc/indice.md`.
