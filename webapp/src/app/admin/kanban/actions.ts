"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificarEvento } from "@/lib/email/queue";

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

  if (estado === "contratado") {
    const { data: postulacion } = await supabase
      .from("postulaciones")
      .select(
        "postulantes(nombre, apellido), perfiles_busqueda(titulo_puesto, empresas(nombre)), selectores(nombre, email, telefono)"
      )
      .eq("id", id)
      .single();

    const postulante = postulacion?.postulantes as unknown as { nombre: string; apellido: string } | null;
    const perfil = postulacion?.perfiles_busqueda as unknown as {
      titulo_puesto: string;
      empresas: { nombre: string } | null;
    } | null;
    const selector = postulacion?.selectores as unknown as {
      nombre: string;
      email: string;
      telefono: string;
    } | null;

    await notificarEvento({
      eventoCodigo: "candidato_contratado",
      destinatarios: [
        {
          email: selector?.email,
          nombre: selector?.nombre,
          telefono: selector?.telefono,
          variables: {
            nombre_selector: selector?.nombre ?? "",
            candidato_nombre: `${postulante?.nombre ?? ""} ${postulante?.apellido ?? ""}`.trim(),
            puesto: perfil?.titulo_puesto ?? "",
            empresa_nombre: perfil?.empresas?.nombre ?? "",
          },
        },
      ],
    });
  }

  revalidatePath("/admin/kanban");
}
