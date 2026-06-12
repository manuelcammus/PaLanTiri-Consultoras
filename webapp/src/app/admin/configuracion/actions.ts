"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { desconectarGoogle } from "@/lib/google/oauth";

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

export async function actualizarAlerta(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");
  const data = {
    activar_email: formData.get("activar_email") === "on",
    activar_whatsapp: formData.get("activar_whatsapp") === "on",
    plantilla_email: val(formData, "plantilla_email"),
    plantilla_whatsapp: val(formData, "plantilla_whatsapp"),
  };

  const { error } = await supabase.from("configuracion_alertas").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
}

export async function desconectarGoogleAction() {
  await desconectarGoogle();
  revalidatePath("/admin/configuracion");
}

export async function actualizarEstadoBusqueda(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");
  const data = {
    nombre: val(formData, "nombre"),
    color: val(formData, "color"),
  };

  const { error } = await supabase.from("estados_busqueda").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
}

export async function actualizarEstadoPostulante(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");
  const data = {
    nombre: val(formData, "nombre"),
    color: val(formData, "color"),
  };

  const { error } = await supabase.from("estados_postulante").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
}
