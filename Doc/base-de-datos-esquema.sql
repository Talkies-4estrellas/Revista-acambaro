-- BORRADOR del esquema de Supabase para ACOM-Di (23-10-2026). NO SE HA EJECUTADO en ningún lado.
-- Cuando exista el proyecto: revisar, guardar como supabase/migrations/0001_inicial.sql y aplicar.
-- Plan y decisiones: Doc/base-de-datos.md

create extension if not exists citext;

/* ---------------------------------------------------------------- Ediciones */

create table public.ediciones (
  id            text primary key check (id ~ '^[A-Za-z0-9_-]{1,40}$'),
  numero        text not null default '',
  numero_fijo   boolean not null default false,
  fecha         date not null,
  tema          text not null default '',
  publicada     boolean not null default false,
  publicar_en   timestamptz,                         -- publicación programada (hora real, no «hora de México» en texto)
  maestra       jsonb,                               -- elementos que se repiten en todas las páginas
  paginas       jsonb not null default '[]'::jsonb check (jsonb_typeof(paginas) = 'array'),
  rev           integer not null default 1,          -- sustituye a la «marca» de modificación (detecta cambios desde otra pestaña)
  creada        timestamptz not null default now(),
  actualizada   timestamptz not null default now(),
  borrada_en    timestamptz                          -- papelera (borrado lógico)
);

create index ediciones_publicas_idx on public.ediciones (fecha desc) where publicada and borrada_en is null;

create or replace function public.tocar_edicion() returns trigger language plpgsql as $$
begin
  new.actualizada := now();
  new.rev := old.rev + 1;
  return new;
end $$;
create trigger ediciones_toca before update on public.ediciones for each row execute function public.tocar_edicion();

create table public.ediciones_versiones (
  id          bigserial primary key,
  edicion_id  text not null references public.ediciones (id) on delete cascade,
  creada      timestamptz not null default now(),
  datos       jsonb not null,                         -- la edición completa tal como estaba
  motivo      text not null default 'guardado'
);
create index ediciones_versiones_idx on public.ediciones_versiones (edicion_id, creada desc);

/* -------------------------------------------------------------------- Medios */

create table public.medios (
  ruta     text primary key check (ruta ~ '^/media/[A-Za-z0-9_-]+/[^/]+$'),   -- «/media/05/estacion.jpg»: la misma que usan las ediciones
  carpeta  text not null,
  nombre   text not null,
  tipo     text not null check (tipo in ('imagen', 'video')),
  bytes    bigint not null,
  ancho    integer,
  alto     integer,
  creado   timestamptz not null default now()
);

/* ------------------------------------------------------ Plantillas y elementos */

create table public.plantillas (
  id           text primary key,
  nombre       text not null,
  descripcion  text not null default '',
  pagina       jsonb not null,
  creada       timestamptz not null default now()
);

create table public.elementos_guardados (
  id        text primary key,
  nombre    text not null,
  w         numeric not null,
  h         numeric not null,
  elementos jsonb not null check (jsonb_typeof(elementos) = 'array'),
  creada    timestamptz not null default now()
);

/* ------------------------------------------------------------- Estadísticas */

create table public.clics_dia (
  edicion_id text not null references public.ediciones (id) on delete cascade,
  elemento   text not null,
  url        text not null,
  dia        date not null,
  total      integer not null default 0,
  pagina     integer not null,
  etiqueta   text not null default '',
  anuncio    boolean not null default false,
  primary key (edicion_id, elemento, url, dia)
);

create table public.vistas_dia (
  edicion_id text not null references public.ediciones (id) on delete cascade,
  pagina     integer not null,
  dia        date not null,
  total      integer not null default 0,
  primary key (edicion_id, pagina, dia)
);

/* ------------------------------------------------------------- Suscriptores */

create table public.suscriptores (
  email    citext primary key,
  token    uuid not null default gen_random_uuid() unique,
  alta     timestamptz not null default now(),
  baja_en  timestamptz,
  origen   text not null default 'sitio'
);

/* ------------------------------------------------------ Seguridad (RLS activa) */

alter table public.ediciones            enable row level security;
alter table public.ediciones_versiones  enable row level security;
alter table public.medios               enable row level security;
alter table public.plantillas           enable row level security;
alter table public.elementos_guardados  enable row level security;
alter table public.clics_dia            enable row level security;
alter table public.vistas_dia           enable row level security;
alter table public.suscriptores         enable row level security;

-- El público (clave anon) solo ve ediciones publicadas, ya programadas y no borradas. Nada más es legible con esa clave.
create policy ediciones_lectura_publica on public.ediciones
  for select to anon, authenticated
  using (publicada and borrada_en is null and (publicar_en is null or publicar_en <= now()));

-- La clave de servicio (solo en el panel local) se salta RLS: no hace falta política para escribir.

/* ------------------------------------- Funciones públicas (estadísticas y newsletter) */
-- Cada una valida por dentro y hace una sola cosa; así el sitio no necesita una clave con permisos amplios.

create or replace function public.registrar_vista(p_edicion text, p_pagina integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from ediciones e
    where e.id = p_edicion and e.publicada and e.borrada_en is null
      and (e.publicar_en is null or e.publicar_en <= now())
      and p_pagina between 1 and jsonb_array_length(e.paginas)
  ) then return; end if;
  insert into vistas_dia (edicion_id, pagina, dia, total) values (p_edicion, p_pagina, (now() at time zone 'utc')::date, 1)
  on conflict (edicion_id, pagina, dia) do update set total = vistas_dia.total + 1;
end $$;

create or replace function public.registrar_clic(p_edicion text, p_elemento text, p_url text)
returns void language plpgsql security definer set search_path = public as $$
declare
  p integer; el jsonb; pg jsonb;
begin
  if length(p_url) > 2000 or p_url !~* '^(https?://|mailto:|tel:|/[^/])' then return; end if;
  -- El enlace debe existir de verdad en una edición publicada (igual que lib/clics.ts hoy).
  for p in 1..coalesce((select jsonb_array_length(paginas) from ediciones where id = p_edicion and publicada and borrada_en is null), 0) loop
    select paginas -> (p - 1) into pg from ediciones where id = p_edicion;
    select x into el from jsonb_array_elements(coalesce(pg -> 'elementos', '[]'::jsonb)) x
      where x ->> 'id' = p_elemento and x ->> 'enlace' = p_url limit 1;
    if el is not null then
      insert into clics_dia (edicion_id, elemento, url, dia, total, pagina, etiqueta, anuncio)
      values (p_edicion, p_elemento, p_url, (now() at time zone 'utc')::date, 1, p,
              left(regexp_replace(coalesce(el ->> 'texto', el ->> 'alt', ''), '\s+', ' ', 'g'), 80), (pg ->> 'seccion') = 'Publicidad')
      on conflict (edicion_id, elemento, url, dia) do update set total = clics_dia.total + 1, pagina = excluded.pagina;
      return;
    end if;
  end loop;
end $$;

create or replace function public.suscribir(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 254 then raise exception 'correo no válido'; end if;
  insert into suscriptores (email) values (lower(trim(p_email)))
  on conflict (email) do update set baja_en = null;
end $$;

create or replace function public.dar_de_baja(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update suscriptores set baja_en = now() where token = p_token and baja_en is null;
  return found;
end $$;

revoke all on function public.registrar_vista(text, integer), public.registrar_clic(text, text, text), public.suscribir(text), public.dar_de_baja(uuid) from public;
grant execute on function public.registrar_vista(text, integer), public.registrar_clic(text, text, text), public.suscribir(text), public.dar_de_baja(uuid) to anon, authenticated;

/* ------------------------------------------------------------------- Storage */
-- Crear el bucket «media» (público de lectura) desde el panel de Supabase o con:
--   insert into storage.buckets (id, name, public) values ('media', 'media', true);
-- La escritura en el bucket solo con la clave de servicio (sin políticas de escritura para anon).
