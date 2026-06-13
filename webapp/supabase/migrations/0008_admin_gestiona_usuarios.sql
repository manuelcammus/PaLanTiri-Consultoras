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
