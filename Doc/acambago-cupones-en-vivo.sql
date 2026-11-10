-- Cupones de AcambaGo en vivo en el panel de la revista (/admin/cupones).
-- Se corre UNA sola vez en el SQL Editor de Supabase del proyecto de AcambaGo (no en la revista).
-- Solo agrega la tabla `coupons` a la publicación de Realtime: no cambia datos, columnas ni permisos.
-- Es lo mismo que AcambaGo ya hace con orders, messages y reservations.

ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;

-- Comprobar que quedó (debe salir una fila con coupons):
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'coupons';

-- Para deshacerlo:
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.coupons;
