-- ============================================================
-- BUNDLE DE MIGRACIONES - Plataforma Palantiri
-- Pegar TODO esto en Supabase -> SQL Editor -> RUN (una sola vez,
-- en una base NUEVA y vacia). Incluye migraciones 0001 a 0008.
-- ============================================================

-- >>>>>>>>>>>>>>>>>>>>>>  0001_schema.sql  <<<<<<<<<<<<<<<<<<<<<<
-- ============================================================
-- ATS Consultora HR — Esquema completo para Supabase (Postgres)
-- Migración 0001: tipos, tablas, funciones y triggers
-- Traducido desde los modelos Django originales.
-- Ejecutar en el SQL Editor de Supabase (o via supabase db push).
-- ============================================================

-- ------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ------------------------------------------------------------
create type rol_usuario as enum ('super_admin', 'admin', 'consultora', 'selector');
create type area_busqueda as enum ('it', 'admin', 'ejecutivo', 'otro');
create type tipo_empresa_t as enum ('privada', 'publica');
create type modalidad_contratacion_t as enum ('a_riesgo', 'con_anticipo');
create type garantia_empresa_t as enum ('con_garantia', 'sin_garantia');
create type nivel_busqueda_t as enum ('senior', 'semi_senior', 'junior', 'practicante');
create type prioridad_t as enum ('baja', 'normal', 'alta', 'urgente');
create type especializacion_t as enum ('it', 'admin', 'ejecutivo', 'general');
create type estado_selector_t as enum ('activo', 'inactivo', 'pausado', 'baja');
create type estado_asignacion_t as enum ('nueva', 'aceptada', 'rechazada', 'completada', 'cancelada');
create type genero_t as enum ('masculino', 'femenino', 'otro', 'prefiere_no_decir');
create type estado_postulacion_t as enum (
  'enviada', 'recibida', 'entrevista', 'oferta', 'aceptada_postulante',
  'contratado', 'rechazada_empresa', 'rechazada_postulante', 'cancelada'
);
create type tipo_entrevista_t as enum ('seleccion', 'tecnica', 'rrhh', 'final');
create type resultado_entrevista_t as enum ('no_evaluado', 'favorable', 'revisar', 'desfavorable', 'no_asistio');
create type estado_garantia_t as enum ('vigente', 'completada', 'incumplida', 'anulada');
create type motivo_incumplimiento_t as enum ('empresa_despidio', 'postulante_renuncio', 'acuerdo', 'otro');
create type tipo_disponibilidad_t as enum ('disponible', 'ocupado', 'entrevista');
create type metodo_pago_t as enum ('transferencia', 'efectivo', 'cheque', 'otro');
create type estado_whatsapp_t as enum ('pendiente', 'enviado', 'error');
create type destinatarios_alerta_t as enum (
  'asignados', 'activos', 'ambos', 'cierre', 'sourcing', 'ambos_comision', 'grupo', 'especifico'
);

-- ------------------------------------------------------------
-- 2. PERFILES DE USUARIO (vinculados a Supabase Auth)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null default '',
  apellido text not null default '',
  telefono text not null default '',
  rol rol_usuario not null default 'selector',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse un usuario.
-- El rol se lee de app_metadata (solo modificable desde el servidor con
-- la service key), NUNCA de user_metadata, para evitar escalada de privilegios.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, apellido, rol)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', ''),
    coalesce((new.raw_app_meta_data ->> 'rol')::rol_usuario, 'selector')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. FUNCIONES HELPER DE AUTORIZACIÓN
--    (security definer para evitar recursión en políticas RLS)
-- ------------------------------------------------------------
create or replace function public.current_rol()
returns rol_usuario
language sql stable security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_rol() in ('super_admin', 'admin', 'consultora'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_rol() in ('super_admin', 'admin'), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_rol() = 'super_admin', false);
$$;

-- (current_selector_id se define más abajo, después de crear la tabla selectores)

-- Solo un super admin (o el servidor) puede cambiar roles.
create or replace function public.proteger_cambio_rol()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new; -- contexto de servidor (service role)
  end if;
  if new.rol is distinct from old.rol and not public.is_super_admin() then
    raise exception 'Solo un super administrador puede cambiar roles de usuario';
  end if;
  return new;
end;
$$;

create trigger trg_proteger_cambio_rol
  before update on public.profiles
  for each row execute function public.proteger_cambio_rol();

-- updated_at genérico
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. TABLAS DE CATÁLOGO
-- ------------------------------------------------------------
create table public.rubros (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table public.codigos_puesto (
  id bigint generated always as identity primary key,
  codigo varchar(4) not null unique,
  nombre text not null
);

create table public.codigos_titulo (
  id bigint generated always as identity primary key,
  codigo varchar(4) not null unique,
  nombre text not null
);

create table public.niveles_estudio (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  peso integer not null default 0
);

create table public.tipos_empleo (
  id bigint generated always as identity primary key,
  nombre text not null unique
);

create table public.habilidades (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  categoria_sugerida text not null default ''
);

create table public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  descripcion text not null default '',
  area area_busqueda not null default 'otro',
  activa boolean not null default true,
  fecha_creacion timestamptz not null default now()
);

create table public.estados_busqueda (
  id bigint generated always as identity primary key,
  codigo text unique,
  nombre text not null unique,
  color varchar(7) not null default '#34c759',
  no_borrable boolean not null default false,
  orden integer not null default 0,
  fecha_creacion timestamptz not null default now()
);

create table public.estados_postulante (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  color varchar(7) not null default '#34c759',
  no_borrable boolean not null default false,
  orden integer not null default 0,
  enviar_email_automatico boolean not null default false,
  plantilla_email text not null default '',
  plantilla_whatsapp text not null default '',
  fecha_creacion timestamptz not null default now()
);

create table public.esquemas_comision (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  descripcion text not null default '',
  porcentaje_sourcing numeric(5,2) not null default 10.00,
  porcentaje_cierre numeric(5,2) not null default 40.00
);

-- ------------------------------------------------------------
-- 5. SELECTORES Y GRUPOS
-- ------------------------------------------------------------
create table public.grupos_selector (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  descripcion text not null default ''
);

create table public.selectores (
  id bigint generated always as identity primary key,
  profile_id uuid unique references public.profiles (id) on delete set null,
  nombre text not null,
  apellido text not null,
  email text not null unique,
  telefono text not null default '',
  especializacion especializacion_t not null default 'general',
  experiencia_anos integer not null default 0,
  descripcion_perfil text not null default '',
  alias_publico text unique,
  pais text not null default 'Argentina',
  provincia text not null default '',
  ciudad text not null default '',
  estado estado_selector_t not null default 'activo',
  cuit text not null unique,
  dni text unique,
  banco text not null default '',
  numero_cuenta text not null default '',
  cbu varchar(22) not null default '',
  alias_cvu text not null default '',
  cantidad_postulantes_enviados integer not null default 0,
  cantidad_contratados integer not null default 0,
  tasa_efectividad numeric(5,2) not null default 0.00,
  comision_porcentaje_defecto numeric(5,2) not null default 50.00
    check (comision_porcentaje_defecto between 0 and 100),
  fecha_registro timestamptz not null default now(),
  fecha_ultima_actividad timestamptz not null default now(),
  google_email text,
  google_contact_id text
);

create index idx_selectores_estado on public.selectores (estado);
create index idx_selectores_especializacion on public.selectores (especializacion);

-- ID del selector vinculado al usuario logueado (usado por las políticas RLS).
-- Se define recién acá porque las funciones "language sql" validan su cuerpo
-- al crearse, y necesitan que la tabla selectores ya exista.
create or replace function public.current_selector_id()
returns bigint
language sql stable security definer
set search_path = public
as $$
  select id from public.selectores where profile_id = auth.uid();
$$;

-- Slug automático para el alias público (juan-perez, juan-perez-1, ...)
create or replace function public.generar_alias_selector()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidato text;
  contador integer := 1;
begin
  if new.alias_publico is null or new.alias_publico = '' then
    base_slug := lower(regexp_replace(
      translate(new.nombre || '-' || new.apellido,
        'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouAEIOUnNuU'),
      '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'selector'; end if;
    candidato := base_slug;
    while exists (select 1 from public.selectores
                  where alias_publico = candidato
                    and (new.id is null or id <> new.id)) loop
      candidato := base_slug || '-' || contador;
      contador := contador + 1;
    end loop;
    new.alias_publico := candidato;
  end if;
  return new;
end;
$$;

create trigger trg_selectores_alias
  before insert or update on public.selectores
  for each row execute function public.generar_alias_selector();

create table public.selector_grupos (
  selector_id bigint not null references public.selectores (id) on delete cascade,
  grupo_id bigint not null references public.grupos_selector (id) on delete cascade,
  primary key (selector_id, grupo_id)
);

-- ------------------------------------------------------------
-- 6. EMPRESAS Y PERFILES DE BÚSQUEDA
-- ------------------------------------------------------------
create table public.empresas (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  razon_social text,
  tipo_empresa tipo_empresa_t not null default 'privada',
  rubro_id bigint references public.rubros (id) on delete set null,
  email_principal text not null unique,
  email_alterno text,
  telefono text not null default '',
  website text,
  pais text not null default 'Argentina',
  provincia text not null default '',
  ciudad text not null default '',
  direccion text not null default '',
  codigo_postal text,
  latitud double precision,
  longitud double precision,
  contacto_nombre text not null default '',
  contacto_email text not null default '',
  contacto_telefono text not null default '',
  contacto_puesto text not null default '',
  contacto_comercial_nombre text,
  contacto_comercial_cargo text,
  contacto_comercial_telefono text,
  contacto_comercial_email text,
  modalidad_contratacion modalidad_contratacion_t not null default 'a_riesgo',
  garantia garantia_empresa_t not null default 'con_garantia',
  comision_porcentaje numeric(5,2) not null default 20.00
    check (comision_porcentaje between 0 and 100),
  salario_promedio_ofrecido numeric(12,2),
  activa boolean not null default true,
  fecha_registro timestamptz not null default now(),
  fecha_ultima_busqueda timestamptz,
  google_contact_id text,
  google_calendar_id text,
  codigo varchar(4)
);

create index idx_empresas_email on public.empresas (email_principal);
create index idx_empresas_activa on public.empresas (activa);
create index idx_empresas_fecha_registro on public.empresas (fecha_registro);

-- Código de 4 letras autogenerado a partir del nombre (igual que Django)
create or replace function public.generar_codigo_empresa()
returns trigger
language plpgsql
as $$
declare
  limpio text;
begin
  if (new.codigo is null or new.codigo = '') and new.nombre is not null then
    limpio := upper(regexp_replace(new.nombre, '[^a-zA-Z0-9]', '', 'g'));
    new.codigo := rpad(substr(limpio, 1, 4), 4, 'X');
  end if;
  return new;
end;
$$;

create trigger trg_empresas_codigo
  before insert or update on public.empresas
  for each row execute function public.generar_codigo_empresa();

create table public.contactos_empresa (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.empresas (id) on delete cascade,
  nombre text not null,
  puesto text not null default '',
  email text not null,
  telefono text not null default '',
  departamento text not null default '',
  es_contacto_principal boolean not null default false,
  fecha_agregado timestamptz not null default now(),
  unique (empresa_id, email)
);

create table public.perfiles_busqueda (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.empresas (id) on delete cascade,
  titulo_puesto text not null,
  descripcion text not null default '',
  areas area_busqueda not null default 'otro',
  nivel nivel_busqueda_t not null default 'semi_senior',
  habilidades_requeridas text not null default '',
  educacion_minima text not null default '',
  nivel_estudio_minimo_id bigint references public.niveles_estudio (id) on delete set null,
  experiencia_minima_anios integer not null default 1,
  es_remoto boolean not null default false,
  ubicacion_puesto text not null default '',
  salario_minimo numeric(12,2) not null default 0 check (salario_minimo >= 0),
  salario_maximo numeric(12,2) not null default 0 check (salario_maximo >= 0),
  beneficios text not null default '',
  estado_id bigint references public.estados_busqueda (id) on delete restrict,
  cantidad_posiciones integer not null default 1,
  selector_asignado_id bigint references public.selectores (id) on delete set null,
  fecha_creacion timestamptz not null default now(),
  fecha_vencimiento date,
  fecha_cierre timestamptz,
  prioridad prioridad_t not null default 'normal',
  notas_internas text not null default '',
  jd_url text,
  flyer_url text,
  flyer_imagen_path text, -- ruta en Supabase Storage (bucket flyers)
  comision_porcentaje numeric(5,2),
  salario_estipulado_comision numeric(12,2),
  mision_puesto text,
  responsabilidades text,
  requisitos_excluyentes text,
  requisitos_deseables text,
  jornada_laboral text,
  observaciones text,
  candidato_ideal text,
  preguntas_informe text,
  descansos text,
  convenio text,
  edad_rango text,
  zona_residencia text,
  fecha_inicio date,
  codigo_puesto varchar(4),
  codigo_titulo varchar(4),
  codigo_busqueda text unique
);

create index idx_perfiles_empresa_estado on public.perfiles_busqueda (empresa_id, estado_id);
create index idx_perfiles_areas on public.perfiles_busqueda (areas);
create index idx_perfiles_fecha on public.perfiles_busqueda (fecha_creacion);
create index idx_perfiles_selector on public.perfiles_busqueda (selector_asignado_id);

-- Código de búsqueda EMPR-PUES-TITU-0001 (misma lógica que Django)
create or replace function public.generar_codigo_busqueda()
returns trigger
language plpgsql
as $$
declare
  co_emp text;
  co_pue text;
  co_tit text;
  seq integer;
begin
  select coalesce(codigo, 'XXXX') into co_emp from public.empresas where id = new.empresa_id;

  co_pue := upper(regexp_replace(coalesce(nullif(new.codigo_puesto, ''), 'PUE'), '[^a-zA-Z0-9]', '', 'g'));
  co_pue := rpad(substr(co_pue, 1, 4), 4, 'X');
  new.codigo_puesto := co_pue;

  co_tit := upper(regexp_replace(coalesce(nullif(new.codigo_titulo, ''), 'TIT'), '[^a-zA-Z0-9]', '', 'g'));
  co_tit := rpad(substr(co_tit, 1, 4), 4, 'X');
  new.codigo_titulo := co_tit;

  if new.codigo_busqueda is null
     or new.codigo_busqueda not like (co_emp || '-' || co_pue || '-' || co_tit || '-%') then
    select count(*) + 1 into seq from public.perfiles_busqueda
      where empresa_id = new.empresa_id and (new.id is null or id <> new.id);
    new.codigo_busqueda := co_emp || '-' || co_pue || '-' || co_tit || '-' || lpad(seq::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_perfiles_codigo
  before insert or update on public.perfiles_busqueda
  for each row execute function public.generar_codigo_busqueda();

create table public.perfil_habilidades (
  perfil_id bigint not null references public.perfiles_busqueda (id) on delete cascade,
  habilidad_id bigint not null references public.habilidades (id) on delete cascade,
  primary key (perfil_id, habilidad_id)
);

create table public.perfil_tipos_empleo (
  perfil_id bigint not null references public.perfiles_busqueda (id) on delete cascade,
  tipo_empleo_id bigint not null references public.tipos_empleo (id) on delete cascade,
  primary key (perfil_id, tipo_empleo_id)
);

-- ------------------------------------------------------------
-- 7. ASIGNACIONES DE BÚSQUEDA A SELECTORES
-- ------------------------------------------------------------
create table public.asignaciones_busqueda (
  id bigint generated always as identity primary key,
  selector_id bigint not null references public.selectores (id) on delete cascade,
  perfil_busqueda_id bigint not null references public.perfiles_busqueda (id) on delete cascade,
  estado estado_asignacion_t not null default 'nueva',
  fecha_asignacion timestamptz not null default now(),
  fecha_aceptacion timestamptz,
  fecha_rechazo timestamptz,
  motivo_rechazo text not null default '',
  fecha_limite_entrega date,
  cantidad_postulantes_esperados integer not null default 3,
  notas text not null default '',
  cantidad_postulantes_enviados integer not null default 0,
  cantidad_contratados integer not null default 0,
  unique (selector_id, perfil_busqueda_id)
);

create index idx_asignaciones_selector on public.asignaciones_busqueda (selector_id, estado);
create index idx_asignaciones_perfil on public.asignaciones_busqueda (perfil_busqueda_id, estado);

create table public.historial_asignaciones (
  id bigint generated always as identity primary key,
  asignacion_id bigint not null references public.asignaciones_busqueda (id) on delete cascade,
  estado_anterior text not null,
  estado_nuevo text not null,
  fecha_cambio timestamptz not null default now(),
  motivo text not null default ''
);

create or replace function public.registrar_historial_asignacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado is distinct from old.estado then
    insert into public.historial_asignaciones (asignacion_id, estado_anterior, estado_nuevo)
    values (new.id, old.estado::text, new.estado::text);
  end if;
  return new;
end;
$$;

create trigger trg_historial_asignacion
  after update on public.asignaciones_busqueda
  for each row execute function public.registrar_historial_asignacion();

-- ------------------------------------------------------------
-- 8. POSTULANTES
-- ------------------------------------------------------------
create table public.postulantes (
  id bigint generated always as identity primary key,
  nombre text not null,
  apellido text not null,
  email text not null,
  telefono text not null default '',
  fecha_nacimiento date,
  genero genero_t,
  pais text not null default 'Argentina',
  provincia text not null default '',
  ciudad text not null default '',
  disponibilidad_mudanza boolean not null default false,
  titulo_principal text not null default '',
  resumen_profesional text not null default '',
  experiencia_anos integer not null default 0,
  titulaciones text not null default '',
  nivel_estudio_id bigint references public.niveles_estudio (id) on delete set null,
  habilidades text not null default '',
  idiomas text not null default '',
  salario_pretendido_minimo numeric(12,2),
  salario_pretendido_maximo numeric(12,2),
  acepta_remoto boolean not null default true,
  acepta_hibrido boolean not null default true,
  acepta_presencial boolean not null default true,
  cv_path text, -- ruta en Supabase Storage (bucket cvs)
  cv_texto_extraido text not null default '',
  linkedin_url text,
  portfolio_url text,
  github_url text,
  estado_id bigint references public.estados_postulante (id) on delete restrict,
  fecha_cambio_estado timestamptz not null default now(),
  selector_id bigint references public.selectores (id) on delete set null,
  guardado_en_pool boolean not null default true,
  fecha_carga timestamptz not null default now(),
  fecha_ultima_actualizacion timestamptz not null default now(),
  contactado_reciente boolean not null default false,
  fecha_ultimo_contacto timestamptz,
  google_contact_id text
);

create index idx_postulantes_email on public.postulantes (email);
create index idx_postulantes_estado on public.postulantes (estado_id);
create index idx_postulantes_selector on public.postulantes (selector_id);
create index idx_postulantes_fecha_carga on public.postulantes (fecha_carga desc);
create index idx_postulantes_ubicacion on public.postulantes (ciudad, provincia);
create index idx_postulantes_pool on public.postulantes (guardado_en_pool);

create or replace function public.postulante_cambio_estado()
returns trigger
language plpgsql
as $$
begin
  new.fecha_ultima_actualizacion := now();
  if tg_op = 'UPDATE' and new.estado_id is distinct from old.estado_id then
    new.fecha_cambio_estado := now();
  end if;
  return new;
end;
$$;

create trigger trg_postulante_estado
  before update on public.postulantes
  for each row execute function public.postulante_cambio_estado();

create table public.postulante_categorias (
  postulante_id bigint not null references public.postulantes (id) on delete cascade,
  categoria_id bigint not null references public.categorias (id) on delete cascade,
  primary key (postulante_id, categoria_id)
);

create table public.postulante_tipos_empleo (
  postulante_id bigint not null references public.postulantes (id) on delete cascade,
  tipo_empleo_id bigint not null references public.tipos_empleo (id) on delete cascade,
  primary key (postulante_id, tipo_empleo_id)
);

create table public.postulante_habilidades (
  postulante_id bigint not null references public.postulantes (id) on delete cascade,
  habilidad_id bigint not null references public.habilidades (id) on delete cascade,
  primary key (postulante_id, habilidad_id)
);

create table public.titulos_postulante (
  id bigint generated always as identity primary key,
  postulante_id bigint not null references public.postulantes (id) on delete cascade,
  titulo text not null,
  empresa text not null default '',
  fecha_inicio date not null,
  fecha_fin date,
  descripcion text not null default ''
);

create table public.disponibilidad_postulante (
  id bigint generated always as identity primary key,
  postulante_id bigint not null references public.postulantes (id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  tipo tipo_disponibilidad_t not null default 'disponible',
  nota text not null default '',
  google_event_id text
);

create table public.notas_postulante (
  id bigint generated always as identity primary key,
  postulante_id bigint not null references public.postulantes (id) on delete cascade,
  autor_selector_id bigint references public.selectores (id) on delete set null,
  titulo text not null default '',
  contenido text not null,
  privada boolean not null default false,
  fecha_creacion timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 9. POSTULACIONES (núcleo del flujo)
-- ------------------------------------------------------------
create table public.postulaciones (
  id bigint generated always as identity primary key,
  postulante_id bigint not null references public.postulantes (id) on delete cascade,
  perfil_busqueda_id bigint not null references public.perfiles_busqueda (id) on delete cascade,
  selector_id bigint references public.selectores (id) on delete set null,
  estado estado_postulacion_t not null default 'enviada',
  fecha_envio timestamptz not null default now(),
  fecha_recepcion_empresa timestamptz,
  fecha_primera_entrevista timestamptz,
  fecha_oferta timestamptz,
  fecha_aceptacion_postulante timestamptz,
  fecha_inicio_laboral date,
  fecha_cierre timestamptz,
  puntaje_empresa integer check (puntaje_empresa between 1 and 10),
  feedback_empresa text not null default '',
  motivo_rechazo text not null default '',
  notas_selector text not null default '',
  notas_admin text not null default '',
  unique (postulante_id, perfil_busqueda_id)
);

create index idx_postulaciones_estado on public.postulaciones (estado);
create index idx_postulaciones_postulante on public.postulaciones (postulante_id, estado);
create index idx_postulaciones_perfil on public.postulaciones (perfil_busqueda_id, estado);
create index idx_postulaciones_selector on public.postulaciones (selector_id);
create index idx_postulaciones_fecha on public.postulaciones (fecha_envio desc);

create table public.historial_postulacion (
  id bigint generated always as identity primary key,
  postulacion_id bigint not null references public.postulaciones (id) on delete cascade,
  estado_anterior text not null,
  estado_nuevo text not null,
  fecha_cambio timestamptz not null default now(),
  motivo text not null default ''
);

create index idx_historial_postulacion on public.historial_postulacion (postulacion_id, fecha_cambio desc);

-- Máquina de estados + fechas automáticas (BEFORE UPDATE).
-- Los selectores respetan el flujo estricto; el staff puede corregir libremente.
create or replace function public.postulacion_before_update()
returns trigger
language plpgsql
as $$
declare
  transicion_valida boolean;
begin
  if new.estado is distinct from old.estado then
    if not public.is_staff() and auth.uid() is not null then
      transicion_valida := case old.estado
        when 'enviada' then new.estado in ('recibida', 'rechazada_empresa', 'cancelada')
        when 'recibida' then new.estado in ('entrevista', 'rechazada_empresa', 'cancelada')
        when 'entrevista' then new.estado in ('oferta', 'rechazada_empresa', 'cancelada')
        when 'oferta' then new.estado in ('aceptada_postulante', 'rechazada_postulante', 'cancelada')
        when 'aceptada_postulante' then new.estado in ('contratado', 'cancelada')
        else false
      end;
      if not transicion_valida then
        raise exception 'Transición de estado inválida: % → %', old.estado, new.estado;
      end if;
    end if;

    case new.estado
      when 'recibida' then new.fecha_recepcion_empresa := now();
      when 'entrevista' then new.fecha_primera_entrevista := now();
      when 'oferta' then new.fecha_oferta := now();
      when 'aceptada_postulante' then new.fecha_aceptacion_postulante := now();
      when 'contratado' then new.fecha_cierre := now();
      when 'rechazada_empresa' then new.fecha_cierre := now();
      when 'rechazada_postulante' then new.fecha_cierre := now();
      when 'cancelada' then new.fecha_cierre := now();
      else null;
    end case;
  end if;
  return new;
end;
$$;

create trigger trg_postulacion_before_update
  before update on public.postulaciones
  for each row execute function public.postulacion_before_update();

-- ------------------------------------------------------------
-- 10. GARANTÍAS
-- ------------------------------------------------------------
create table public.seguimiento_garantia (
  id bigint generated always as identity primary key,
  postulacion_id bigint not null unique references public.postulaciones (id) on delete cascade,
  dias_garantia integer not null default 90,
  fecha_inicio date,
  fecha_vencimiento date,
  estado estado_garantia_t not null default 'vigente',
  fecha_fin_real date,
  motivo_incumplimiento motivo_incumplimiento_t,
  perfil_busqueda_reemplazo_id bigint references public.perfiles_busqueda (id) on delete set null,
  postulacion_reemplazo_id bigint references public.postulaciones (id) on delete set null,
  notas text not null default ''
);

create index idx_garantias_estado on public.seguimiento_garantia (estado);
create index idx_garantias_vencimiento on public.seguimiento_garantia (fecha_vencimiento);

-- ------------------------------------------------------------
-- 11. ENTREVISTAS E INFORMES
-- ------------------------------------------------------------
create table public.entrevistas_agendadas (
  id bigint generated always as identity primary key,
  postulacion_id bigint not null references public.postulaciones (id) on delete cascade,
  tipo tipo_entrevista_t not null default 'seleccion',
  fecha_hora timestamptz not null,
  duracion_minutos integer not null default 60,
  entrevistador text not null default '',
  usa_google_meet boolean not null default true,
  google_meet_url text,
  google_event_id text,
  ubicacion text not null default '',
  realizada boolean not null default false,
  fecha_resultado timestamptz,
  resultado resultado_entrevista_t not null default 'no_evaluado',
  comentarios_entrevistador text not null default ''
);

create index idx_entrevistas_fecha on public.entrevistas_agendadas (fecha_hora);

create table public.informes_entrevista (
  id bigint generated always as identity primary key,
  postulacion_id bigint not null unique references public.postulaciones (id) on delete cascade,
  fecha_entrevista date not null default current_date,
  empresa_puesto_actual text not null default '',
  experiencia_detalle text not null default '',
  formacion_academica text not null default '',
  situacion_actual text not null default '',
  sueldo_bruto_pretendido numeric(12,2),
  comentarios_selector text not null default '',
  creado_el timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 12. COMISIONES
-- ------------------------------------------------------------
create table public.estados_comision (
  id bigint generated always as identity primary key,
  codigo text not null unique,
  nombre text not null,
  descripcion text not null default '',
  color varchar(7) not null default '#34c759',
  no_borrable boolean not null default false,
  activar_email boolean not null default false,
  activar_whatsapp boolean not null default false,
  plantilla_email text not null default '',
  plantilla_whatsapp text not null default '',
  destinatarios destinatarios_alerta_t not null default 'cierre',
  destinatario_grupo_id bigint references public.grupos_selector (id) on delete set null,
  destinatario_especifico_id bigint references public.selectores (id) on delete set null
);

create table public.comisiones (
  id bigint generated always as identity primary key,
  postulacion_id bigint not null unique references public.postulaciones (id) on delete cascade,
  selector_id bigint not null references public.selectores (id) on delete cascade,
  empresa_id bigint not null references public.empresas (id) on delete cascade,
  salario_mensual numeric(12,2) not null,
  comision_porcentaje_empresa numeric(5,2) not null,
  comision_porcentaje_selector numeric(5,2) not null,
  porcentaje_sourcing numeric(5,2) not null default 10.00,
  porcentaje_cierre numeric(5,2) not null default 40.00,
  monto_total numeric(12,2) not null default 0,
  monto_empresa numeric(12,2) not null default 0,
  monto_selector numeric(12,2) not null default 0,
  monto_sourcing numeric(12,2) not null default 0,
  monto_cierre numeric(12,2) not null default 0,
  selector_sourcing_id bigint references public.selectores (id) on delete set null,
  aplica_clawback boolean not null default false,
  monto_devolucion numeric(12,2) not null default 0,
  estado_id bigint references public.estados_comision (id) on delete restrict,
  fecha_calculo timestamptz not null default now(),
  fecha_inicio_trabajo date not null,
  fecha_vencimiento_garantia date not null,
  fecha_pago date,
  numero_comprobante text not null default '',
  metodo_pago text not null default '',
  notas text not null default ''
);

create index idx_comisiones_selector on public.comisiones (selector_id);
create index idx_comisiones_empresa on public.comisiones (empresa_id);
create index idx_comisiones_estado on public.comisiones (estado_id);
create index idx_comisiones_fecha on public.comisiones (fecha_calculo desc);

-- Cálculo atómico de montos: SIEMPRE consistente, imposible de olvidar.
create or replace function public.comision_calcular_montos()
returns trigger
language plpgsql
as $$
begin
  new.monto_total := round(new.salario_mensual * new.comision_porcentaje_empresa / 100.0, 2);
  new.comision_porcentaje_selector := new.porcentaje_sourcing + new.porcentaje_cierre;
  new.monto_selector := round(new.monto_total * new.comision_porcentaje_selector / 100.0, 2);
  new.monto_sourcing := round(new.monto_total * new.porcentaje_sourcing / 100.0, 2);
  new.monto_cierre := round(new.monto_total * new.porcentaje_cierre / 100.0, 2);
  new.monto_empresa := new.monto_total - new.monto_selector;
  return new;
end;
$$;

create trigger trg_comision_montos
  before insert or update on public.comisiones
  for each row execute function public.comision_calcular_montos();

create table public.pagos_comision (
  id bigint generated always as identity primary key,
  comision_id bigint not null references public.comisiones (id) on delete cascade,
  monto numeric(12,2) not null,
  fecha_pago date not null default current_date,
  metodo metodo_pago_t not null default 'transferencia',
  numero_comprobante text not null default '',
  banco_origen text not null default '',
  banco_destino text not null default '',
  cuenta_destino text not null default '',
  notas text not null default '',
  fecha_creacion timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 13. AUTOMATIZACIÓN CENTRAL: al pasar a CONTRATADO se crea la
--     comisión y la garantía en la MISMA transacción (atómico).
--     Reemplaza (y mejora) el signal post_save de Django.
-- ------------------------------------------------------------
create or replace function public.postulacion_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_selector_id bigint;
  v_salario numeric(12,2);
  v_pct_empresa numeric(5,2);
  v_estado_comision_id bigint;
  v_fecha_inicio date;
  v_sueldo_informe numeric(12,2);
  v_salario_pretendido numeric(12,2);
  perfil record;
begin
  -- Historial de cambios de estado
  if tg_op = 'UPDATE' and new.estado is distinct from old.estado then
    insert into public.historial_postulacion (postulacion_id, estado_anterior, estado_nuevo)
    values (new.id, old.estado::text, new.estado::text);
  end if;

  -- Creación atómica de comisión + garantía al contratar
  if new.estado = 'contratado'
     and (tg_op = 'INSERT' or old.estado is distinct from new.estado)
     and not exists (select 1 from public.comisiones where postulacion_id = new.id) then

    select * into perfil from public.perfiles_busqueda where id = new.perfil_busqueda_id;

    -- Selector: el de la postulación → el que cargó al postulante → el asignado a la búsqueda
    v_selector_id := new.selector_id;
    if v_selector_id is null then
      select selector_id into v_selector_id from public.postulantes where id = new.postulante_id;
    end if;
    if v_selector_id is null then
      v_selector_id := perfil.selector_asignado_id;
    end if;
    if v_selector_id is null then
      select id into v_selector_id from public.selectores where estado = 'activo' limit 1;
    end if;
    if v_selector_id is null then
      return new; -- sin selector no hay comisión (igual que Django)
    end if;

    -- Salario: estipulado para comisión → informe de entrevista → pretendido → mínimo de la búsqueda
    select sueldo_bruto_pretendido into v_sueldo_informe
      from public.informes_entrevista where postulacion_id = new.id;
    select salario_pretendido_minimo into v_salario_pretendido
      from public.postulantes where id = new.postulante_id;

    v_salario := coalesce(
      perfil.salario_estipulado_comision,
      v_sueldo_informe,
      v_salario_pretendido,
      perfil.salario_minimo,
      0
    );

    -- Porcentaje empresa: el de la búsqueda → el de la empresa → 20%
    v_pct_empresa := coalesce(
      perfil.comision_porcentaje,
      (select comision_porcentaje from public.empresas where id = perfil.empresa_id),
      20.00
    );

    v_fecha_inicio := coalesce(new.fecha_inicio_laboral, current_date);

    select id into v_estado_comision_id
      from public.estados_comision where codigo = 'pendiente_cobro';

    insert into public.comisiones (
      postulacion_id, selector_id, empresa_id,
      salario_mensual, comision_porcentaje_empresa, comision_porcentaje_selector,
      estado_id, fecha_inicio_trabajo, fecha_vencimiento_garantia
    ) values (
      new.id, v_selector_id, perfil.empresa_id,
      v_salario, v_pct_empresa, 50.00,
      v_estado_comision_id, v_fecha_inicio, v_fecha_inicio + interval '90 days'
    );

    -- Garantía de reemplazo
    insert into public.seguimiento_garantia (postulacion_id, dias_garantia, fecha_inicio, fecha_vencimiento, estado)
    values (new.id, 90, v_fecha_inicio, v_fecha_inicio + interval '90 days', 'vigente')
    on conflict (postulacion_id) do nothing;

    -- Actualizar estadísticas del selector
    update public.selectores s set
      cantidad_contratados = (
        select count(*) from public.postulaciones p
        where p.selector_id = s.id and p.estado = 'contratado'),
      tasa_efectividad = case
        when (select count(*) from public.postulaciones p where p.selector_id = s.id) = 0 then 0
        else round(
          (select count(*) from public.postulaciones p
            where p.selector_id = s.id and p.estado = 'contratado')::numeric * 100
          / (select count(*) from public.postulaciones p where p.selector_id = s.id), 2)
      end
    where s.id = v_selector_id;
  end if;

  return new;
end;
$$;

create trigger trg_postulacion_after_change
  after insert or update on public.postulaciones
  for each row execute function public.postulacion_after_change();

-- Contador de postulantes enviados por selector y por asignación
create or replace function public.postulacion_after_insert_contadores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.selector_id is not null then
    update public.selectores
      set cantidad_postulantes_enviados = cantidad_postulantes_enviados + 1,
          fecha_ultima_actividad = now()
      where id = new.selector_id;
    update public.asignaciones_busqueda
      set cantidad_postulantes_enviados = cantidad_postulantes_enviados + 1
      where selector_id = new.selector_id and perfil_busqueda_id = new.perfil_busqueda_id;
  end if;
  return new;
end;
$$;

create trigger trg_postulacion_contadores
  after insert on public.postulaciones
  for each row execute function public.postulacion_after_insert_contadores();

-- ------------------------------------------------------------
-- 14. ALERTAS Y COLA DE WHATSAPP
-- ------------------------------------------------------------
create table public.configuracion_alertas (
  id bigint generated always as identity primary key,
  evento_codigo text not null unique,
  nombre text not null,
  activar_email boolean not null default true,
  activar_whatsapp boolean not null default true,
  plantilla_email text not null default '',
  plantilla_whatsapp text not null default '',
  destinatarios destinatarios_alerta_t not null default 'asignados',
  destinatario_grupo_id bigint references public.grupos_selector (id) on delete set null,
  destinatario_especifico_id bigint references public.selectores (id) on delete set null
);

-- Cola que consume el worker local de Selenium (via API REST con service key)
create table public.whatsapp_messages (
  id bigint generated always as identity primary key,
  numero_destino text not null,
  mensaje text not null,
  estado estado_whatsapp_t not null default 'pendiente',
  fecha_creacion timestamptz not null default now(),
  fecha_envio timestamptz,
  error_log text
);

create index idx_whatsapp_pendientes on public.whatsapp_messages (estado, fecha_creacion);

-- ------------------------------------------------------------
-- 15. INTEGRACIÓN GOOGLE WORKSPACE
-- ------------------------------------------------------------
create table public.google_tokens (
  id bigint generated always as identity primary key,
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  token jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_google_tokens_updated before update on public.google_tokens
  for each row execute function public.set_updated_at();

create table public.google_logs (
  id bigint generated always as identity primary key,
  service text not null,
  operation text not null,
  status text not null,
  message text not null default '',
  ts timestamptz not null default now()
);

create index idx_google_logs_ts on public.google_logs (ts desc);

-- >>>>>>>>>>>>>>>>>>>>>>  0002_rls.sql  <<<<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>>>  0003_seed.sql  <<<<<<<<<<<<<<<<<<<<<<
-- ============================================================
-- Migración 0003: Datos iniciales (seeds)
-- ============================================================

-- Estados de búsqueda
insert into public.estados_busqueda (codigo, nombre, color, no_borrable, orden) values
  ('abierta',    'Abierta',     '#34c759', true, 1),
  ('en_proceso', 'En Proceso',  '#007aff', true, 2),
  ('pausada',    'Pausada',     '#ff9500', false, 3),
  ('cerrada',    'Cerrada',     '#8e8e93', true, 4),
  ('cancelada',  'Cancelada',   '#ff3b30', true, 5);

-- Estados de postulante
insert into public.estados_postulante (nombre, color, no_borrable, orden) values
  ('Nuevo',        '#34c759', true, 1),
  ('En Revisión',  '#007aff', false, 2),
  ('En Entrevista','#5856d6', false, 3),
  ('Finalista',    '#ff9500', false, 4),
  ('Contratado',   '#30d158', true, 5),
  ('Descartado',   '#ff3b30', true, 6),
  ('En Pool',      '#8e8e93', false, 7);

-- Estados de comisión (los códigos coinciden con los que usa el trigger)
insert into public.estados_comision (codigo, nombre, color, no_borrable, destinatarios) values
  ('calculada',       'Calculada',                      '#8e8e93', true, 'cierre'),
  ('pendiente_cobro', 'Pendiente de Cobro (Empresa)',   '#ff9500', true, 'cierre'),
  ('cobrada',         'Cobrada (Empresa)',              '#007aff', true, 'cierre'),
  ('pendiente_pago',  'Pendiente de Pago (Selector)',   '#5856d6', true, 'cierre'),
  ('pagada',          'Pagada (Selector)',              '#34c759', true, 'cierre'),
  ('garantia',        'En Período de Garantía',         '#ffcc00', true, 'cierre'),
  ('completada',      'Completada',                     '#30d158', true, 'cierre'),
  ('anulada',         'Anulada',                        '#ff3b30', true, 'cierre');

-- Esquema de comisión estándar (10% sourcing / 40% cierre, como en Django)
insert into public.esquemas_comision (nombre, descripcion, porcentaje_sourcing, porcentaje_cierre) values
  ('Estándar', 'Esquema por defecto: 10% sourcing, 40% cierre sobre el total facturado', 10.00, 40.00);

-- Niveles de estudio
insert into public.niveles_estudio (nombre, peso) values
  ('Posgrado / Maestría', 50),
  ('Universitario Completo', 40),
  ('Universitario en Curso', 35),
  ('Terciario Completo', 30),
  ('Terciario en Curso', 25),
  ('Secundario Completo', 20),
  ('Secundario Incompleto', 10);

-- Tipos de empleo
insert into public.tipos_empleo (nombre) values
  ('Tiempo Completo'),
  ('Medio Tiempo'),
  ('Por Contrato'),
  ('Freelance'),
  ('Pasantía'),
  ('Temporal');

-- Eventos de alerta base (mismos códigos que usaba Django)
insert into public.configuracion_alertas (evento_codigo, nombre, plantilla_email, plantilla_whatsapp, destinatarios) values
  ('nueva_busqueda', 'Nueva Búsqueda Disponible',
   'Hola {nombre_selector}, hay una nueva búsqueda: {titulo_puesto} en {empresa_nombre}.',
   'Hola {nombre_selector}! 🔍 Nueva búsqueda: *{titulo_puesto}* en {empresa_nombre}.',
   'activos'),
  ('comision_pagada', 'Comisión Pagada',
   'Hola {nombre_selector}, se registró el pago de tu comisión de {monto_comision} por {candidato_nombre} ({puesto} en {empresa_nombre}).',
   'Hola {nombre_selector}! 💰 Se pagó tu comisión de *{monto_comision}* por {candidato_nombre}.',
   'ambos_comision'),
  ('garantia_ejecutada', 'Garantía Ejecutada (Clawback)',
   'Hola {nombre_selector}, se ejecutó la garantía de {candidato_nombre} ({puesto} en {empresa_nombre}). Monto a descontar: {monto_devolucion}.',
   'Hola {nombre_selector}, ⚠️ se ejecutó la garantía de {candidato_nombre}. Descuento: {monto_devolucion}.',
   'ambos_comision'),
  ('candidato_contratado', 'Candidato Contratado',
   '¡Felicitaciones {nombre_selector}! {candidato_nombre} fue contratado para {puesto} en {empresa_nombre}.',
   '🎉 ¡Felicitaciones {nombre_selector}! *{candidato_nombre}* fue contratado en {empresa_nombre}.',
   'ambos_comision');

-- >>>>>>>>>>>>>>>>>>>>>>  0004_storage.sql  <<<<<<<<<<<<<<<<<<<<<<
-- ============================================================
-- Migración 0004: Buckets de Storage
--   cvs    → privado (CVs de postulantes, acceso por URL firmada)
--   flyers → público (imágenes promocionales de búsquedas)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cvs', 'cvs', false, 10485760, array['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('flyers', 'flyers', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- CVs: staff gestiona todo; el selector sube y lee los que él carga
-- (la ruta debe empezar con su selector_id: "123/archivo.pdf")
create policy "cvs: staff total" on storage.objects
  for all using (bucket_id = 'cvs' and public.is_staff())
  with check (bucket_id = 'cvs' and public.is_staff());

create policy "cvs: selector sube en su carpeta" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = public.current_selector_id()::text
  );

create policy "cvs: selector lee su carpeta" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = public.current_selector_id()::text
  );

-- Flyers: lectura pública, escritura solo staff
create policy "flyers: lectura publica" on storage.objects
  for select using (bucket_id = 'flyers');

create policy "flyers: staff escribe" on storage.objects
  for insert with check (bucket_id = 'flyers' and public.is_staff());

create policy "flyers: staff actualiza" on storage.objects
  for update using (bucket_id = 'flyers' and public.is_staff());

create policy "flyers: staff borra" on storage.objects
  for delete using (bucket_id = 'flyers' and public.is_staff());

-- >>>>>>>>>>>>>>>>>>>>>>  0005_email_queue.sql  <<<<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>>>  0006_configuracion_consultora.sql  <<<<<<<<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>>>>>>>>  0007_instancias_consultoras.sql  <<<<<<<<<<<<<<<<<<<<<<
-- ============================================================
-- Migración 0007: Registro de instancias (consola madre)
--   Solo se usa en la instancia de Palantiri: lista de las
--   consultoras clientes desplegadas, para monitorearlas
--   desde /admin/consola. Visible solo para super_admin.
-- ============================================================

create table public.instancias_consultoras (
  id bigint generated always as identity primary key,
  nombre text not null,
  url text not null, -- https://dominio-de-la-consultora.com (sin barra final)
  notas text not null default '',
  fecha_alta timestamptz not null default now()
);

alter table public.instancias_consultoras enable row level security;

create policy "instancias: solo super admin" on public.instancias_consultoras
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- >>>>>>>>>>>>>>>>>>>>>>  0008_admin_gestiona_usuarios.sql  <<<<<<<<<<<<<<<<<<<<<<
-- ------------------------------------------------------------
-- 0008 — El admin de la consultora gestiona usuarios y selectores
-- ------------------------------------------------------------
-- Hasta ahora SOLO un super_admin podía cambiar roles. En el modelo
-- de consultora autogestionada, el admin debe poder dar de alta y
-- administrar a su propio equipo (usuarios "consultora" y selectores),
-- sin depender del super_admin.
--
-- Regla nueva:
--   * Cambios que involucran 'super_admin' o 'admin'  -> solo super_admin
--   * Cambios entre 'consultora' y 'selector'         -> admin o super_admin
--   * Contexto de servidor (service role)             -> permitido
-- El super_admin (Palantiri) queda como rol reservado, no asignable
-- por un admin: así un admin nunca puede auto-elevarse ni tocar cuentas
-- de plataforma.
-- ------------------------------------------------------------

create or replace function public.proteger_cambio_rol()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new; -- contexto de servidor (service role)
  end if;

  if new.rol is distinct from old.rol then
    -- Tocar el rol super_admin o admin (asignarlo o quitarlo) es exclusivo
    -- del super_admin.
    if new.rol in ('super_admin', 'admin') or old.rol in ('super_admin', 'admin') then
      if not public.is_super_admin() then
        raise exception 'Solo un super administrador puede asignar o quitar los roles admin/super_admin';
      end if;
    else
      -- Reordenar entre consultora y selector: lo puede hacer un admin.
      if not public.is_admin() then
        raise exception 'No tenés permisos para cambiar roles de usuario';
      end if;
    end if;
  end if;

  return new;
end;
$$;
