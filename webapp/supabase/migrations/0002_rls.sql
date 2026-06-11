-- ============================================================
-- Migración 0002: Row Level Security (RLS)
-- Seguridad a nivel de base de datos para los 4 roles:
--   super_admin / admin / consultora  → "staff" (acceso operativo total)
--   selector                          → SOLO sus propios datos
-- La configuración sensible (estados, alertas, esquemas) solo
-- la modifican super_admin y admin.
-- ============================================================

-- ------------------------------------------------------------
-- Habilitar RLS en todas las tablas
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.rubros enable row level security;
alter table public.codigos_puesto enable row level security;
alter table public.codigos_titulo enable row level security;
alter table public.niveles_estudio enable row level security;
alter table public.tipos_empleo enable row level security;
alter table public.habilidades enable row level security;
alter table public.categorias enable row level security;
alter table public.estados_busqueda enable row level security;
alter table public.estados_postulante enable row level security;
alter table public.estados_comision enable row level security;
alter table public.esquemas_comision enable row level security;
alter table public.grupos_selector enable row level security;
alter table public.selectores enable row level security;
alter table public.selector_grupos enable row level security;
alter table public.empresas enable row level security;
alter table public.contactos_empresa enable row level security;
alter table public.perfiles_busqueda enable row level security;
alter table public.perfil_habilidades enable row level security;
alter table public.perfil_tipos_empleo enable row level security;
alter table public.asignaciones_busqueda enable row level security;
alter table public.historial_asignaciones enable row level security;
alter table public.postulantes enable row level security;
alter table public.postulante_categorias enable row level security;
alter table public.postulante_tipos_empleo enable row level security;
alter table public.postulante_habilidades enable row level security;
alter table public.titulos_postulante enable row level security;
alter table public.disponibilidad_postulante enable row level security;
alter table public.notas_postulante enable row level security;
alter table public.postulaciones enable row level security;
alter table public.historial_postulacion enable row level security;
alter table public.seguimiento_garantia enable row level security;
alter table public.entrevistas_agendadas enable row level security;
alter table public.informes_entrevista enable row level security;
alter table public.comisiones enable row level security;
alter table public.pagos_comision enable row level security;
alter table public.configuracion_alertas enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.google_tokens enable row level security;
alter table public.google_logs enable row level security;

-- ------------------------------------------------------------
-- Helpers de pertenencia para selectores
-- ------------------------------------------------------------

-- ¿La búsqueda está asignada al selector logueado?
create or replace function public.busqueda_es_mia(p_perfil_id bigint)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles_busqueda pb
    where pb.id = p_perfil_id
      and pb.selector_asignado_id = public.current_selector_id()
  ) or exists (
    select 1 from public.asignaciones_busqueda ab
    where ab.perfil_busqueda_id = p_perfil_id
      and ab.selector_id = public.current_selector_id()
      and ab.estado in ('nueva', 'aceptada', 'completada')
  );
$$;

-- ¿La postulación pertenece al selector logueado?
create or replace function public.postulacion_es_mia(p_postulacion_id bigint)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.postulaciones p
    where p.id = p_postulacion_id
      and p.selector_id = public.current_selector_id()
  );
$$;

-- ¿El postulante fue cargado por el selector logueado?
create or replace function public.postulante_es_mio(p_postulante_id bigint)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.postulantes po
    where po.id = p_postulante_id
      and po.selector_id = public.current_selector_id()
  );
$$;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create policy "profiles: ver propio o staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy "profiles: editar propio" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());
  -- el trigger trg_proteger_cambio_rol impide auto-elevarse de rol

create policy "profiles: admin gestiona" on public.profiles
  for all using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- CATÁLOGOS: lectura para todo usuario logueado,
-- escritura solo admin/super_admin
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'rubros', 'codigos_puesto', 'codigos_titulo', 'niveles_estudio',
    'tipos_empleo', 'habilidades', 'categorias',
    'estados_busqueda', 'estados_postulante', 'estados_comision',
    'esquemas_comision', 'grupos_selector', 'configuracion_alertas'
  ]
  loop
    execute format(
      'create policy "%s: leer autenticados" on public.%I for select using (auth.uid() is not null)',
      t, t);
    execute format(
      'create policy "%s: escribir admin" on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t, t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- SELECTORES
-- ------------------------------------------------------------
create policy "selectores: staff total" on public.selectores
  for all using (public.is_staff()) with check (public.is_staff());

create policy "selectores: ver propio" on public.selectores
  for select using (profile_id = auth.uid());

create policy "selectores: editar propio" on public.selectores
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "selector_grupos: staff total" on public.selector_grupos
  for all using (public.is_staff()) with check (public.is_staff());

create policy "selector_grupos: ver propios" on public.selector_grupos
  for select using (selector_id = public.current_selector_id());

-- ------------------------------------------------------------
-- EMPRESAS: el selector solo ve empresas de búsquedas asignadas a él
-- ------------------------------------------------------------
create policy "empresas: staff total" on public.empresas
  for all using (public.is_staff()) with check (public.is_staff());

create policy "empresas: selector ve las de sus busquedas" on public.empresas
  for select using (
    exists (
      select 1 from public.perfiles_busqueda pb
      where pb.empresa_id = empresas.id
        and public.busqueda_es_mia(pb.id)
    )
  );

create policy "contactos_empresa: staff total" on public.contactos_empresa
  for all using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------------
-- PERFILES DE BÚSQUEDA
-- ------------------------------------------------------------
create policy "perfiles_busqueda: staff total" on public.perfiles_busqueda
  for all using (public.is_staff()) with check (public.is_staff());

create policy "perfiles_busqueda: selector ve asignadas" on public.perfiles_busqueda
  for select using (public.busqueda_es_mia(id));

create policy "perfil_habilidades: staff total" on public.perfil_habilidades
  for all using (public.is_staff()) with check (public.is_staff());

create policy "perfil_habilidades: selector lee" on public.perfil_habilidades
  for select using (public.busqueda_es_mia(perfil_id));

create policy "perfil_tipos_empleo: staff total" on public.perfil_tipos_empleo
  for all using (public.is_staff()) with check (public.is_staff());

create policy "perfil_tipos_empleo: selector lee" on public.perfil_tipos_empleo
  for select using (public.busqueda_es_mia(perfil_id));

-- ------------------------------------------------------------
-- ASIGNACIONES
-- ------------------------------------------------------------
create policy "asignaciones: staff total" on public.asignaciones_busqueda
  for all using (public.is_staff()) with check (public.is_staff());

create policy "asignaciones: selector ve propias" on public.asignaciones_busqueda
  for select using (selector_id = public.current_selector_id());

create policy "asignaciones: selector acepta/rechaza" on public.asignaciones_busqueda
  for update using (selector_id = public.current_selector_id())
  with check (selector_id = public.current_selector_id());

create policy "historial_asignaciones: staff total" on public.historial_asignaciones
  for all using (public.is_staff()) with check (public.is_staff());

create policy "historial_asignaciones: selector lee propias" on public.historial_asignaciones
  for select using (
    exists (select 1 from public.asignaciones_busqueda ab
            where ab.id = asignacion_id
              and ab.selector_id = public.current_selector_id())
  );

-- ------------------------------------------------------------
-- POSTULANTES: el selector carga y gestiona SOLO los suyos
-- ------------------------------------------------------------
create policy "postulantes: staff total" on public.postulantes
  for all using (public.is_staff()) with check (public.is_staff());

create policy "postulantes: selector ve propios" on public.postulantes
  for select using (selector_id = public.current_selector_id());

create policy "postulantes: selector carga propios" on public.postulantes
  for insert with check (selector_id = public.current_selector_id());

create policy "postulantes: selector edita propios" on public.postulantes
  for update using (selector_id = public.current_selector_id())
  with check (selector_id = public.current_selector_id());

-- M2M de postulantes (mismo criterio de pertenencia)
do $$
declare
  t text;
begin
  foreach t in array array[
    'postulante_categorias', 'postulante_tipos_empleo', 'postulante_habilidades'
  ]
  loop
    execute format(
      'create policy "%s: staff total" on public.%I for all using (public.is_staff()) with check (public.is_staff())',
      t, t);
    execute format(
      'create policy "%s: selector gestiona propios" on public.%I for all using (public.postulante_es_mio(postulante_id)) with check (public.postulante_es_mio(postulante_id))',
      t, t);
  end loop;
end $$;

create policy "titulos_postulante: staff total" on public.titulos_postulante
  for all using (public.is_staff()) with check (public.is_staff());

create policy "titulos_postulante: selector gestiona propios" on public.titulos_postulante
  for all using (public.postulante_es_mio(postulante_id))
  with check (public.postulante_es_mio(postulante_id));

create policy "disponibilidad: staff total" on public.disponibilidad_postulante
  for all using (public.is_staff()) with check (public.is_staff());

create policy "disponibilidad: selector gestiona propios" on public.disponibilidad_postulante
  for all using (public.postulante_es_mio(postulante_id))
  with check (public.postulante_es_mio(postulante_id));

create policy "notas_postulante: staff total" on public.notas_postulante
  for all using (public.is_staff()) with check (public.is_staff());

create policy "notas_postulante: selector lee no privadas de sus postulantes" on public.notas_postulante
  for select using (
    public.postulante_es_mio(postulante_id)
    and (not privada or autor_selector_id = public.current_selector_id())
  );

create policy "notas_postulante: selector escribe en sus postulantes" on public.notas_postulante
  for insert with check (
    public.postulante_es_mio(postulante_id)
    and autor_selector_id = public.current_selector_id()
  );

-- ------------------------------------------------------------
-- POSTULACIONES
-- ------------------------------------------------------------
create policy "postulaciones: staff total" on public.postulaciones
  for all using (public.is_staff()) with check (public.is_staff());

create policy "postulaciones: selector ve propias" on public.postulaciones
  for select using (selector_id = public.current_selector_id());

create policy "postulaciones: selector crea en busquedas asignadas" on public.postulaciones
  for insert with check (
    selector_id = public.current_selector_id()
    and public.busqueda_es_mia(perfil_busqueda_id)
  );

create policy "postulaciones: selector actualiza propias" on public.postulaciones
  for update using (selector_id = public.current_selector_id())
  with check (selector_id = public.current_selector_id());
  -- el trigger postulacion_before_update valida las transiciones de estado

create policy "historial_postulacion: staff total" on public.historial_postulacion
  for all using (public.is_staff()) with check (public.is_staff());

create policy "historial_postulacion: selector lee propias" on public.historial_postulacion
  for select using (public.postulacion_es_mia(postulacion_id));

-- ------------------------------------------------------------
-- GARANTÍAS: el selector las VE (le afectan la comisión), no las toca
-- ------------------------------------------------------------
create policy "garantias: staff total" on public.seguimiento_garantia
  for all using (public.is_staff()) with check (public.is_staff());

create policy "garantias: selector lee propias" on public.seguimiento_garantia
  for select using (public.postulacion_es_mia(postulacion_id));

-- ------------------------------------------------------------
-- ENTREVISTAS E INFORMES
-- ------------------------------------------------------------
create policy "entrevistas: staff total" on public.entrevistas_agendadas
  for all using (public.is_staff()) with check (public.is_staff());

create policy "entrevistas: selector gestiona de sus postulaciones" on public.entrevistas_agendadas
  for all using (public.postulacion_es_mia(postulacion_id))
  with check (public.postulacion_es_mia(postulacion_id));

create policy "informes: staff total" on public.informes_entrevista
  for all using (public.is_staff()) with check (public.is_staff());

create policy "informes: selector gestiona de sus postulaciones" on public.informes_entrevista
  for all using (public.postulacion_es_mia(postulacion_id))
  with check (public.postulacion_es_mia(postulacion_id));

-- ------------------------------------------------------------
-- COMISIONES Y PAGOS: el selector SOLO LEE las suyas
-- (como titular del cierre o del sourcing)
-- ------------------------------------------------------------
create policy "comisiones: staff total" on public.comisiones
  for all using (public.is_staff()) with check (public.is_staff());

create policy "comisiones: selector lee propias" on public.comisiones
  for select using (
    selector_id = public.current_selector_id()
    or selector_sourcing_id = public.current_selector_id()
  );

create policy "pagos: staff total" on public.pagos_comision
  for all using (public.is_staff()) with check (public.is_staff());

create policy "pagos: selector lee de sus comisiones" on public.pagos_comision
  for select using (
    exists (
      select 1 from public.comisiones c
      where c.id = comision_id
        and (c.selector_id = public.current_selector_id()
             or c.selector_sourcing_id = public.current_selector_id())
    )
  );

-- ------------------------------------------------------------
-- WHATSAPP: solo staff (el worker usa la service key y omite RLS)
-- ------------------------------------------------------------
create policy "whatsapp: staff total" on public.whatsapp_messages
  for all using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------------
-- GOOGLE: tokens solo del dueño; logs solo staff
-- ------------------------------------------------------------
create policy "google_tokens: solo dueño" on public.google_tokens
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "google_logs: staff lee" on public.google_logs
  for select using (public.is_staff());

create policy "google_logs: staff escribe" on public.google_logs
  for insert with check (public.is_staff());
