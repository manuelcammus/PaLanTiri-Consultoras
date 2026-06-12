"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

// El input datetime-local llega sin zona horaria; se fija la de Argentina
// (UTC-3, sin horario de verano) para que el timestamptz quede correcto.
function fechaHoraArgentina(v: string): string {
  return `${v}:00-03:00`;
}

export async function agendarEntrevista(formData: FormData) {
  const supabase = await createClient();

  const fechaHora = val(formData, "fecha_hora");
  if (!fechaHora) throw new Error("Falta la fecha y hora de la entrevista.");

  const meetUrl = val(formData, "google_meet_url");

  const { error } = await supabase.from("entrevistas_agendadas").insert({
    postulacion_id: Number(val(formData, "postulacion_id")),
    tipo: val(formData, "tipo") || "seleccion",
    fecha_hora: fechaHoraArgentina(fechaHora),
    duracion_minutos: Number(val(formData, "duracion_minutos") || "60"),
    entrevistador: val(formData, "entrevistador"),
    usa_google_meet: meetUrl !== "",
    google_meet_url: meetUrl || null,
    ubicacion: val(formData, "ubicacion"),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/entrevistas");
}

export async function registrarResultado(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("entrevistas_agendadas")
    .update({
      realizada: true,
      fecha_resultado: new Date().toISOString(),
      resultado: val(formData, "resultado") || "no_evaluado",
      comentarios_entrevistador: val(formData, "comentarios_entrevistador"),
    })
    .eq("id", val(formData, "id"));
  if (error) throw new Error(error.message);

  revalidatePath("/admin/entrevistas");
}

export async function eliminarEntrevista(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("entrevistas_agendadas")
    .delete()
    .eq("id", val(formData, "id"));
  if (error) throw new Error(error.message);

  revalidatePath("/admin/entrevistas");
}
