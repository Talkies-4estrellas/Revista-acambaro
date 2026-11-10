# Instrucciones para AcambaGo: guardar cupones que llegan desde la revista ACOM-Di

## Contexto
La revista digital **ACOM-Di** (otro proyecto, `C:\Revista acambaro`) ya muestra **cupones reales de AcambaGo** dentro de sus ediciones.
- Los lee de la base de Supabase de AcambaGo con la clave **anon**, en **solo lectura**: la tabla `coupons` y el nombre del negocio en `businesses`.
- Muestra el QR con el contenido exacto de `coupons.qr_data`, `{"coupon_code","business_id"}`, **sin `user_id`**. El vendedor lo escanea con el Escáner QR de AcambaGo y `redeem_coupon` lo canjea.
- La revista **no tiene cuentas ni inicio de sesión**, y no las tendrá.

**Lo que falta:** que el lector pueda **guardar el cupón en su cuenta de AcambaGo** y obtener su **QR personal**, el que lleva `user_id` (así ya lo hace `CouponCard.tsx` para compradores con sesión). Así AcambaGo impide que una misma persona lo use dos veces, y queda registrado que el cupón vino de la revista.

## Flujo que se necesita
1. En la revista, el lector toca **«Guárdalo en AcambaGo»** y se abre `https://<dominio de AcambaGo>/cupon/ACAM-XXXXXX?origen=revista`.
2. **Sin sesión:** la página muestra el cupón (descuento, título, negocio, vencimiento) y los botones **Iniciar sesión** y **Crear cuenta**, con Clerk. Al terminar, incluido el `/onboarding` de una cuenta nueva, el lector **regresa a esa misma página** y el cupón se guarda solo.
3. **Con sesión:** el cupón se guarda en su cuenta. Repetirlo no debe duplicar nada. La página muestra su **QR personal** (`qr_data` + `user_id`, igual que `CouponCard.tsx`) y un enlace a **Perfil → Cupones**.
4. **Cupón vencido, agotado, desactivado, de un negocio no aprobado o suspendido, o código inexistente:** un mensaje claro y **no se guarda**. Usa las mismas reglas que `redeem_coupon`.

## Cambios en AcambaGo
1. **Tabla nueva `saved_coupons`**, en un archivo SQL nuevo en `supabase/` que el usuario correrá en el SQL Editor:
   - `id` uuid; `coupon_id` → `coupons(id)` `ON DELETE CASCADE`; `user_id` text → `profiles(id)`; `origin` text, por ejemplo `'revista'` o `'app'`; `saved_at` timestamptz `DEFAULT now()`.
   - `UNIQUE (coupon_id, user_id)`.
   - Seguir la convención de seguridad del proyecto (ver `CLAUDE.md`).
2. **Página pública `/cupon/[code]`** en `(public)`, que muestra el cupón con o sin sesión. Un código desconocido da un mensaje, no un error.
3. **Guardar del lado del servidor:** una ruta de API con `auth()` de Clerk, siguiendo el patrón de `coupons/validate/route.ts`.
   - El `user_id` sale **siempre** de la sesión de Clerk, nunca del navegador.
   - El estado del cupón se revalida en el servidor antes de guardar.
   - `origin` se toma de `?origen=` con una lista blanca: `revista`, y si no, `app`.
4. **Perfil → Cupones** (`perfil/cupones/page.tsx`): mostrar también los **guardados**, con su QR personal y su estado (vigente, vencido o ya usado), además de los canjeados que ya aparecen.
5. **Regreso después de iniciar sesión o registrarse:** la vuelta a `/cupon/[code]?origen=revista` tiene que funcionar también para cuentas nuevas que pasan por el onboarding.
6. **Opcional (si es sencillo):** en el panel del vendedor o del admin, contar cuántos cupones se guardaron desde la revista.

## Lo que NO debe cambiar (la revista depende de esto)
- El formato de `coupons.qr_data` y lo que acepta el escáner. El QR sin `user_id` de la revista debe seguir canjeándose.
- `redeem_coupon` y `/api/coupons/validate`.
- Las columnas de `coupons` que lee la revista: `id, business_id, title, description, discount_type, value, code, qr_data, limit_count, used_count, expires_at, is_active, created_at`, y de `businesses`: `name, is_approved, is_active`.
- La lectura con la clave anon de esas dos tablas.

## Otro SQL pendiente para la revista (correrlo junto con el de arriba)
Hace que el panel de la revista se actualice solo cuando se crea, cambia o borra un cupón:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
```

## Al terminar, avisar a la revista
1. El **formato final del enlace**, por ejemplo `/cupon/{code}?origen=revista`, y si el código va en mayúsculas.
2. El **dominio de producción** de AcambaGo (hoy se usa `https://acambago-kappa.vercel.app`).
3. Si ya se corrieron los dos SQL (`saved_coupons` y Realtime) y si ya está desplegado en Vercel.
4. Cualquier cambio en las tablas o columnas de la lista de arriba.
