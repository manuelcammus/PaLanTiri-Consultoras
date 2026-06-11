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
