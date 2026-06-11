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

function nullableNum(formData: FormData, key: string): number | null {
  const v = val(formData, key);
  return v === "" ? null : Number(v);
}

export async function guardarBusqueda(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");

  const data = {
    empresa_id: Number(val(formData, "empresa_id")),
    titulo_puesto: val(formData, "titulo_puesto"),
    descripcion: val(formData, "descripcion"),
    areas: val(formData, "areas") || "otro",
    nivel: val(formData, "nivel") || "semi_senior",
    experiencia_minima_anios: Number(val(formData, "experiencia_minima_anios") || "0"),
    es_remoto: formData.get("es_remoto") === "on",
    ubicacion_puesto: val(formData, "ubicacion_puesto"),
    salario_minimo: Number(val(formData, "salario_minimo") || "0"),
    salario_maximo: Number(val(formData, "salario_maximo") || "0"),
    cantidad_posiciones: Number(val(formData, "cantidad_posiciones") || "1"),
    estado_id: nullableNum(formData, "estado_id"),
    selector_asignado_id: nullableNum(formData, "selector_asignado_id"),
    prioridad: val(formData, "prioridad") || "normal",
    fecha_vencimiento: nullable(formData, "fecha_vencimiento"),
    notas_internas: val(formData, "notas_internas"),
  };

  if (id) {
    const { error } = await supabase.from("perfiles_busqueda").update(data).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("perfiles_busqueda").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/busquedas");
  redirect("/admin/busquedas");
}

export async function eliminarBusqueda(formData: FormData) {
  const supabase = await createClient();
  const id = val(formData, "id");

  const { error } = await supabase.from("perfiles_busqueda").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/busquedas");
}

export async function asignarSelector(formData: FormData) {
  const supabase = await createClient();

  const perfilBusquedaId = Number(val(formData, "perfil_busqueda_id"));
  const selectorId = Number(val(formData, "selector_id"));
  const cantidadEsperados = Number(val(formData, "cantidad_postulantes_esperados") || "3");
  const fechaLimite = nullable(formData, "fecha_limite_entrega");

  const { error } = await supabase.from("asignaciones_busqueda").insert({
    perfil_busqueda_id: perfilBusquedaId,
    selector_id: selectorId,
    cantidad_postulantes_esperados: cantidadEsperados,
    fecha_limite_entrega: fechaLimite,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/busquedas/${perfilBusquedaId}`);
}

export async function eliminarAsignacion(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");
  const perfilBusquedaId = val(formData, "perfil_busqueda_id");

  const { error } = await supabase.from("asignaciones_busqueda").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/busquedas/${perfilBusquedaId}`);
}
