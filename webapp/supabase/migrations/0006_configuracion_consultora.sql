-- ============================================================
-- Migración 0006: Identidad configurable de la consultora
--   Tabla de una sola fila con el nombre, logo y datos de
--   contacto que personalizan cada instancia (whitelabel).
--   La marca del producto (Palantiri) queda fija en el código.
-- ============================================================

create table public.configuracion_consultora (
  id smallint primary key default 1 check (id = 1),
  nombre text not null default 'Mi Consultora',
  logo_path text, -- ruta en el bucket público "flyers" (carpeta branding/)
  telefono text not null default '',
  email_contacto text not null default '',
  sitio_web text not null default '',
  actualizado_el timestamptz not null default now()
);

alter table public.configuracion_consultora enable row level security;

-- La identidad es pública: se muestra en la pantalla de login sin sesión
create policy "consultora: lectura publica" on public.configuracion_consultora
  for select using (true);

create policy "consultora: staff escribe" on public.configuracion_consultora
  for all using (public.is_staff()) with check (public.is_staff());

insert into public.configuracion_consultora (id, nombre)
values (1, 'Palantiri Consultoras')
on conflict (id) do nothing;
