import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "./resend";

type Destinatario = {
  email?: string | null;
  nombre?: string | null;
  variables: Record<string, string>;
};

function renderPlantilla(plantilla: string, variables: Record<string, string>) {
  return plantilla.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? "");
}

// Encola y envía un email para cada destinatario según la configuración del
// evento. Si el evento tiene el email desactivado, o falta la plantilla, no
// hace nada. Los errores de envío no se propagan: quedan registrados en
// email_messages con estado "error".
export async function notificarEvento({
  eventoCodigo,
  destinatarios,
}: {
  eventoCodigo: string;
  destinatarios: Destinatario[];
}) {
  try {
    const admin = createAdminClient();

    const { data: config } = await admin
      .from("configuracion_alertas")
      .select("nombre, activar_email, plantilla_email")
      .eq("evento_codigo", eventoCodigo)
      .maybeSingle();

    if (!config?.activar_email || !config.plantilla_email) return;

    const vistos = new Set<string>();

    for (const dest of destinatarios) {
      if (!dest.email || vistos.has(dest.email)) continue;
      vistos.add(dest.email);

      const cuerpo = renderPlantilla(config.plantilla_email, dest.variables);

      const { data: mensaje, error: errorInsert } = await admin
        .from("email_messages")
        .insert({
          destinatario_email: dest.email,
          destinatario_nombre: dest.nombre ?? "",
          asunto: config.nombre,
          cuerpo,
          evento_codigo: eventoCodigo,
        })
        .select("id")
        .single();

      if (errorInsert || !mensaje) {
        console.error(
          `notificarEvento(${eventoCodigo}): no se pudo registrar el email en la cola`,
          errorInsert
        );
        continue;
      }

      try {
        await enviarEmail({
          to: dest.email,
          subject: config.nombre,
          html: cuerpo.replace(/\n/g, "<br>"),
        });
        await admin
          .from("email_messages")
          .update({ estado: "enviado", fecha_envio: new Date().toISOString() })
          .eq("id", mensaje.id);
      } catch (e) {
        await admin
          .from("email_messages")
          .update({ estado: "error", error_log: String(e) })
          .eq("id", mensaje.id);
      }
    }
  } catch (e) {
    console.error(`notificarEvento(${eventoCodigo}) falló:`, e);
  }
}
