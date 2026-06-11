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
