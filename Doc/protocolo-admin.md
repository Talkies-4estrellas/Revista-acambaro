# Protocolo del panel: nunca en el sitio publicado

El panel `/admin` no tiene contraseña y escribe archivos del proyecto. Por eso **solo existe en el equipo de quien edita**. El sitio
publicado en Vercel es de solo lectura para el público: no se puede entrar al panel ni llamar a su API.

## Las capas

| Capa | Dónde | Qué hace |
|---|---|---|
| Regla única | `src/lib/admin-acceso.ts` (`adminPermitido`) | Decide quién puede entrar. Todas las demás capas la usan. |
| Entrada | `src/proxy.ts` | Responde 404 en `/admin` y `/api/admin` antes de que llegue a su código, aunque a una ruta nueva se le olvide su guardia. |
| Páginas | `src/app/admin/layout.tsx` | Responde 404 con `notFound()` en todas las páginas del panel. |
| API | `verificarPeticion` en `src/lib/admin.ts` | Cada método de `/api/admin` lo llama; además rechaza peticiones de otro origen. |
| Acciones de servidor | `src/app/admin/portada-actions.tsx` | Vuelve a comprobar `adminPermitido`, porque una acción no pasa por `/api/admin`. |
| Revisión | `scripts/verificar-admin.mjs` | Corre sola antes de cada `npm run build` y detiene la compilación si algo falta. |

## La regla, en orden

1. **En Vercel, nunca.** Si existe `VERCEL` o `VERCEL_ENV`, se niega sin mirar nada más. Un `ADMIN_ENABLED` puesto por descuido en Vercel no abre el panel.
2. **En una compilación de producción, no** salvo con `ADMIN_ENABLED=true` (solo para pruebas locales con `next start`).
3. **En la red local, no** salvo con `ADMIN_ALLOW_REMOTE=true` (no recomendado: el panel no tiene contraseña).
4. **En desarrollo, solo desde este equipo:** `localhost`, `127.0.0.1` o `::1`.

`ADMIN_ENABLED` y `ADMIN_ALLOW_REMOTE` no se pueden cambiar desde **Ajustes**: abren el panel, así que solo se editan a mano en `.env.local`.

## Al agregar algo al panel

- **Página nueva** en `src/app/admin/`: queda protegida por el layout. Agrega su nombre a `IDS_RESERVADOS` en `src/lib/admin.ts`, o una edición con ese nombre no se podría abrir.
- **Ruta nueva** en `src/app/api/admin/`: cada método debe llamar a `verificarPeticion(req)` (o a `adminPermitido`). `verificar-admin` falla si falta.
- **Acción de servidor** (`"use server"`) que lea o escriba datos del panel: debe comprobar `adminPermitido((await headers()).get("host"))`.
- **Datos privados** (`content/*.json` con datos de personas o negocios): agrégalos a `.gitignore` y a `PRIVADOS` en `scripts/verificar-admin.mjs`.

## Cómo comprobarlo

```bash
npm run verificar-admin
```

Para probar además el sitio publicado (hace peticiones a todas las rutas del panel y exige que todas den 404; tarda unos minutos):

```bash
node scripts/verificar-admin.mjs https://revista-acambaro.vercel.app
```

`npm test` también comprueba la regla y la entrada (`tests/proxy.test.ts`).
