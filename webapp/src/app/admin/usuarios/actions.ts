"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { esAdmin, esSuperAdmin, type Rol } from "@/lib/types";

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

const ROLES_PROTEGIDOS: Rol[] = ["super_admin", "admin"];

// Devuelve el perfil del que llama si tiene permiso para gestionar usuarios.
// Un admin solo puede tocar roles consultora/selector; los roles
// admin/super_admin son exclusivos del super_admin (Palantiri).
async function exigirGestorUsuarios() {
  const perfil = await getProfile();
  if (!esAdmin(perfil?.rol)) {
    throw new Error("No tenés permisos para gestionar usuarios");
  }
  return perfil!;
}

function asegurarRolPermitido(rolDestino: string, esSuper: boolean) {
  if (!esSuper && ROLES_PROTEGIDOS.includes(rolDestino as Rol)) {
    throw new Error(
      "Solo Palantiri (super administrador) puede asignar los roles Administrador o Super Administrador",
    );
  }
}

export async function crearUsuario(formData: FormData) {
  const perfil = await exigirGestorUsuarios();
  const esSuper = esSuperAdmin(perfil.rol);

  const admin = createAdminClient();

  const email = val(formData, "email");
  const password = val(formData, "password");
  const nombre = val(formData, "nombre");
  const apellido = val(formData, "apellido");
  const rol = val(formData, "rol") || "selector";

  asegurarRolPermitido(rol, esSuper);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido },
  });
  if (error) throw new Error(error.message);

  const { error: errorPerfil } = await admin
    .from("profiles")
    .update({ nombre, apellido, rol })
    .eq("id", data.user.id);
  if (errorPerfil) throw new Error(errorPerfil.message);

  // Si es selector, vincular automáticamente con un registro de selectores por email
  if (rol === "selector") {
    await admin.from("selectores").update({ profile_id: data.user.id }).eq("email", email);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function actualizarUsuario(formData: FormData) {
  const perfil = await exigirGestorUsuarios();
  const esSuper = esSuperAdmin(perfil.rol);

  const id = val(formData, "id");
  const rolDestino = val(formData, "rol");

  // Un admin no puede tocar cuentas admin/super_admin ni promover a esos roles.
  if (!esSuper) {
    const admin = createAdminClient();
    const { data: objetivo } = await admin
      .from("profiles")
      .select("rol")
      .eq("id", id)
      .single();
    if (objetivo && ROLES_PROTEGIDOS.includes(objetivo.rol as Rol)) {
      throw new Error("No podés modificar una cuenta de Administrador o Super Administrador");
    }
    asegurarRolPermitido(rolDestino, esSuper);
  }

  const supabase = await createClient();
  const data = {
    nombre: val(formData, "nombre"),
    apellido: val(formData, "apellido"),
    telefono: val(formData, "telefono"),
    rol: rolDestino,
    activo: formData.get("activo") === "on",
  };

  const { error } = await supabase.from("profiles").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function eliminarUsuario(formData: FormData) {
  const perfil = await exigirGestorUsuarios();
  const esSuper = esSuperAdmin(perfil.rol);

  const admin = createAdminClient();
  const id = val(formData, "id");

  // Un admin no puede eliminar cuentas admin/super_admin.
  if (!esSuper) {
    const { data: objetivo } = await admin
      .from("profiles")
      .select("rol")
      .eq("id", id)
      .single();
    if (objetivo && ROLES_PROTEGIDOS.includes(objetivo.rol as Rol)) {
      throw new Error("No podés eliminar una cuenta de Administrador o Super Administrador");
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}
