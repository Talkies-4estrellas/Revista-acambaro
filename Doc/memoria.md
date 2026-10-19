# ACOM-Di · Revista de Acámbaro — Memoria de sesiones

## Convención de trabajo

Cada sesión de trabajo con el asistente IA genera un archivo de sesión en `Doc/sesiones/`.

### Reglas
1. **Una sesión por día** — el archivo se nombra `sesion-DD-MM-YYYY.md` (día-mes-año, con guiones).
2. **Crear el archivo al inicio** del trabajo, antes de comenzar; si ya existe el de hoy, seguir en él.
3. **Registrar al final** qué se hizo, qué quedó pendiente y cualquier decisión importante.
4. **Nunca editar sesiones de días anteriores** — son historial inmutable.
5. **Los commits y el `git push` los hace el usuario** — el asistente nunca hace `git commit` ni `git push`.
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

> Lo hecho antes de existir esta carpeta (editor de lienzo, edición móvil «apilar», animaciones, clics, newsletter, ediciones 01–13)
> está descrito en `documentacion/documento.md` y en `GUIA-EDICIONES.md`.
