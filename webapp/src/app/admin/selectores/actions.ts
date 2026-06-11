"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

function nullable(formData: FormData, key: string): string | null {
  const v = val(formData, key);
  return v === "" ? null : v;
}

export async function guardarSelector(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");

  const data = {
    nombre: val(formData, "nombre"),
    apellido: val(formData, "apellido"),
    email: val(formData, "email"),
    telefono: val(formData, "telefono"),
    especializacion: val(formData, "especializacion") || "general",
    experiencia_anos: Number(val(formData, "experiencia_anos") || "0"),
    descripcion_perfil: val(formData, "descripcion_perfil"),
    pais: val(formData, "pais") || "Argentina",
    provincia: val(formData, "provincia"),
    ciudad: val(formData, "ciudad"),
    estado: val(formData, "estado") || "activo",
    cuit: val(formData, "cuit"),
    dni: nullable(formData, "dni"),
    banco: val(formData, "banco"),
    numero_cuenta: val(formData, "numero_cuenta"),
    cbu: val(formData, "cbu"),
    alias_cvu: val(formData, "alias_cvu"),
    comision_porcentaje_defecto: Number(val(formData, "comision_porcentaje_defecto") || "50"),
  };

  if (id) {
    const { error } = await supabase.from("selectores").update(data).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("selectores").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/selectores");
  redirect("/admin/selectores");
}

export async function eliminarSelector(formData: FormData) {
  const supabase = await createClient();
  const id = val(formData, "id");

  const { error } = await supabase.from("selectores").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/selectores");
}
