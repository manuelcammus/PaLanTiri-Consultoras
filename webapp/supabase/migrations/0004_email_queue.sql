-- ------------------------------------------------------------
-- 16. COLA DE EMAILS (alertas automáticas)
-- ------------------------------------------------------------
create type estado_email_t as enum ('pendiente', 'enviado', 'error');

create table public.email_messages (
  id bigint generated always as identity primary key,
  destinatario_email text not null,
  destinatario_nombre text not null default '',
  asunto text not null,
  cuerpo text not null,
  evento_codigo text,
  estado estado_email_t not null default 'pendiente',
  fecha_creacion timestamptz not null default now(),
  fecha_envio timestamptz,
  error_log text
);

create index idx_email_pendientes on public.email_messages (estado, fecha_creacion);

alter table public.email_messages enable row level security;

create policy "email_messages: staff" on public.email_messages
  for all using (public.is_staff()) with check (public.is_staff());
