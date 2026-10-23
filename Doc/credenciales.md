# ACOM-Di · Credenciales y variables de entorno

> **No escribas aquí contraseñas ni claves reales.** Este archivo solo lista qué variables existen y para qué sirven. Los valores
> viven en `.env.local` (no se sube a Git) y en el panel de Vercel (Settings → Environment Variables).

El proyecto no usa base de datos ni cuentas de usuario: todo son archivos JSON. Estas variables son **opcionales**:

| Variable | Dónde | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `.env.local` y Vercel | Dirección pública del sitio (imágenes al compartir, enlaces del newsletter) |
| `CLICS_WEBHOOK_URL` | Vercel | En Vercel no se puede escribir archivos: envía cada clic a una hoja de cálculo o servicio |
| `SUSCRIPCION_WEBHOOK_URL` | Vercel | Envía altas del newsletter a una hoja o servicio |
| `ADMIN_ENABLED` | `.env.local` | Activa el panel `/admin` en una compilación de producción local (`next start`). **Nunca en Vercel**: allí el panel está cerrado de todos modos |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` y Vercel | (Futuro, ver `Doc/base-de-datos.md`) Conexión pública a Supabase: solo lectura de lo publicado y funciones de estadísticas |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo** `.env.local` | (Futuro) Clave de servicio del panel local. Jamás en Vercel ni en el repositorio |
| `DATOS_DRIVER` | `.env.local` y Vercel | (Futuro) `archivos` (por omisión) o `supabase`: de dónde leen y escriben los datos |
| `ADMIN_ALLOW_REMOTE` | `.env.local` | Permite abrir el panel desde otra computadora de la red (no recomendado) |

## Servicios y cuentas del proyecto
| Servicio | Uso |
|---|---|
| GitHub (`Talkies-4estrellas/Revista-acambaro`) | Código y contenido de las ediciones |
| Vercel (`revista-acambaro.vercel.app`) | Publicación (privada por ahora; demo para colaboradores y marcas) |
| Wikimedia Commons | Fuente de fotos y logos (créditos en la página de créditos de cada edición) |
