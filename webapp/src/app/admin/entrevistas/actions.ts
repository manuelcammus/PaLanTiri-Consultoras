"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getConsultora } from "@/lib/consultora";
import { crearEventoEntrevista, eliminarEvento } from "@/lib/google/calendar";

const TIPO_LABEL: Record<string, string> = {
  seleccion: "Selección",
  tecnica: "Técnica",
  rrhh: "RRHH",
  final: "Final",
};

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

  const postulacionId = Number(val(formData, "postulacion_id"));
  const tipo = val(formData, "tipo") || "seleccion";
  const duracion = Number(val(formData, "duracion_minutos") || "60");
  const entrevistador = val(formData, "entrevistador");
  const meetUrlManual = val(formData, "google_meet_url");
  const crearMeet = formData.get("crear_meet") === "on" && !meetUrlManual;
  const inicio = fechaHoraArgentina(fechaHora);

  const { data: nueva, error } = await supabase
    .from("entrevistas_agendadas")
    .insert({
      postulacion_id: postulacionId,
      tipo,
      fecha_hora: inicio,
      duracion_minutos: duracion,
      entrevistador,
      usa_google_meet: meetUrlManual !== "" || crearMeet,
      google_meet_url: meetUrlManual || null,
      ubicacion: val(formData, "ubicacion"),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Evento en Google Calendar con sala de Meet (si la cuenta está conectada).
  // Si Google falla, la entrevista queda agendada igual, sin link.
  if (crearMeet) {
    const { data: post } = await supabase
      .from("postulaciones")
      .select(
        "postulantes(nombre, apellido, email), perfiles_busqueda(titulo_puesto, empresas(nombre))"
      )
      .eq("id", postulacionId)
      .single();

    const candidato = post?.postulantes as unknown as {
      nombre: string;
      apellido: string;
      email: string;
    } | null;
    const perfil = post?.perfiles_busqueda as unknown as {
      titulo_puesto: string;
      empresas: { nombre: string } | null;
    } | null;

    const consultora = await getConsultora();

    const evento = await crearEventoEntrevista({
      titulo: `Entrevista ${TIPO_LABEL[tipo] ?? tipo}: ${candidato?.nombre ?? ""} ${candidato?.apellido ?? ""} — ${perfil?.titulo_puesto ?? ""}`,
      descripcion: [
        perfil?.empresas?.nombre && `Empresa: ${perfil.empresas.nombre}`,
        entrevistador && `Entrevistador: ${entrevistador}`,
        `Agendada desde ${consultora.nombre}.`,
      ]
        .filter(Boolean)
        .join("\n"),
      inicio,
      duracionMinutos: duracion,
      invitados: [candidato?.email ?? "", entrevistador],
    });

    if (evento) {
      await supabase
        .from("entrevistas_agendadas")
        .update({ google_event_id: evento.eventId, google_meet_url: evento.meetUrl })
        .eq("id", nueva.id);
    }
  }

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
  const id = val(formData, "id");

  const { data: entrevista } = await supabase
    .from("entrevistas_agendadas")
    .select("google_event_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("entrevistas_agendadas").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (entrevista?.google_event_id) {
    await eliminarEvento(entrevista.google_event_id);
  }

  revalidatePath("/admin/entrevistas");
}
