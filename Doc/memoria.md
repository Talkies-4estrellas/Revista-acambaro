# ACOM-Di · Revista de Acámbaro — Memoria de sesiones

## Convención de trabajo

Cada sesión de trabajo con el asistente IA genera un archivo de sesión en `Doc/sesiones/`.

### Reglas
1. **Una sesión por día** — el archivo se nombra `sesion-DD-MM-YYYY.md` (día-mes-año, con guiones).
2. **Crear el archivo al inicio** del trabajo, antes de comenzar; si ya existe el de hoy, seguir en él.
3. **Registrar al final** qué se hizo, qué quedó pendiente y cualquier decisión importante.
4. **Nunca editar sesiones de días anteriores** — son historial inmutable.
5. **Commits solo cuando el usuario los pide** — entonces los ejecuta el asistente (`git add` por archivo); `git push` nunca sin que lo pida.
6. **Toda la documentación va en `Doc/`** — no en `.claude/`, ni sueltas por el proyecto. (La guía para quien arma ediciones,
   `GUIA-EDICIONES.md`, se queda en la raíz porque el panel de administración la menciona.)
7. Al terminar un cambio importante, actualizar también `Doc/indice.md` (archivos nuevos) y `Doc/documentacion/documento.md`
   (si cambió el modelo de datos o una función).

### Formato de cada sesión
```markdown
# Sesión DD-MM-YYYY

## Objetivo del día
Breve descripción de qué se quería lograr.

## Lo que se hizo
- Item 1
- Item 2

## Archivos modificados
- `ruta/archivo.tsx` — descripción del cambio

## Pendientes detectados
- Cosa que quedó sin hacer o que surgió en el camino

## Notas / decisiones
Cualquier decisión de arquitectura o convención que valga recordar.
```

---

## Índice de sesiones

| Fecha | Resumen |
|---|---|
| [16-10-2026](sesiones/sesion-16-10-2026.md) | Edición 10 «Los Azufres» (55 págs.): anuncios en collage, cómic, noticias de México, modo oscuro, revisión móvil y edición demo |
| [19-10-2026](sesiones/sesion-19-10-2026.md) | Mejoras al panel: números de página automáticos, revisor de diseño, plantillas nuevas y edición resumida |
| [20-10-2026](sesiones/sesion-20-10-2026.md) | Editor más seguro: autoguardado y recuperación de cambios |
| [21-10-2026](sesiones/sesion-21-10-2026.md) | Vista móvil del sitio (solo cambios para menos de 640 px) |
| [23-10-2026](sesiones/sesion-23-10-2026.md) | Aviso de seguridad de Next.js, enlaces y estadísticas del editor, mapa de anuncios de Google |
| [26-10-2026](sesiones/sesion-26-10-2026.md) | Editor al estilo Canva: plantillas como panel, tira de páginas, deshacer/rehacer, pantallas pequeñas |
| [27-10-2026](sesiones/sesion-27-10-2026.md) | Galería de medios, selector de color, menú contextual y edición de modelismo |
| [28-10-2026](sesiones/sesion-28-10-2026.md) | Estilos con nombre, reemplazar foto, animar la página, cambiar un color por otro |
| [30-10-2026](sesiones/sesion-30-10-2026.md) | Fotos libres de Wikimedia, índice con titulares y cajas de texto que crecen |
| [02-11-2026](sesiones/sesion-02-11-2026.md) | Página de bienvenida (estilo art-circles), edición de muestra hojeable, cupones y anunciantes |
| [03-11-2026](sesiones/sesion-03-11-2026.md) | Panel del administrador: resumen, portadas, filtros, avisos, menú lateral, publicación, medios, papelera, calendario y ajustes |
| [04-11-2026](sesiones/sesion-04-11-2026.md) | Calendario revisado, buscador rápido Ctrl+K, menú «Secciones» en la bienvenida y mejoras del panel en celular |
| [06-11-2026](sesiones/sesion-06-11-2026.md) | Base del proyecto (ESLint, pruebas, documentación); compartir, temas, seguir leyendo, relacionadas y fotos adaptadas |

> Lo hecho antes de existir esta carpeta (editor de lienzo, edición móvil «apilar», animaciones, clics, newsletter, ediciones 01–13)
> está descrito en `documentacion/documento.md` y en `GUIA-EDICIONES.md`.
