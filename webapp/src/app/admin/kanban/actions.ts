"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function moverPostulacion(formData: FormData) {
  const supabase = await createClient();

  const id = (formData.get("id") as string) ?? "";
  const estado = (formData.get("estado") as string) ?? "";

  const fechaPorEstado: Record<string, string> = {
    recibida: "fecha_recepcion_empresa",
    entrevista: "fecha_primera_entrevista",
    oferta: "fecha_oferta",
    aceptada_postulante: "fecha_aceptacion_postulante",
  };

  const data: Record<string, unknown> = { estado };
  const campoFecha = fechaPorEstado[estado];
  if (campoFecha) data[campoFecha] = new Date().toISOString();
  if (estado === "contratado" || estado.startsWith("rechazada") || estado === "cancelada") {
    data.fecha_cierre = new Date().toISOString();
  }

  const { error } = await supabase.from("postulaciones").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/kanban");
}
