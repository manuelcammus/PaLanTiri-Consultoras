import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "./resend";

type Destinatario = {
  email?: string | null;
  nombre?: string | null;
  telefono?: string | null;
  variables: Record<string, string>;
};

function renderPlantilla(plantilla: string, variables: Record<string, string>) {
  return plantilla.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? "");
}

// Envuelve el cuerpo del email en una plantilla HTML con la marca de la
// consultora y la firma del producto.
function htmlConMarca(cuerpo: string, consultora: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#4338ca;color:#ffffff;padding:14px 20px;border-radius:12px 12px 0 0;font-size:15px;font-weight:bold">${consultora}</div>
  <div style="border:1px solid #e2e8f0;border-top:0;padding:20px;border-radius:0 0 12px 12px;color:#0f172a;font-size:14px;line-height:1.6">${cuerpo.replace(/\n/g, "<br>")}</div>
  <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:10px;line-height:1.4"><strong style="color:#64748b">Palantiri Consultoras</strong><br>Un producto de Palantiri Automat</p>
</div>`;
}

// Normaliza un teléfono argentino al formato que espera WhatsApp Web
// (solo dígitos con código de país y 9 para móviles: 549XXXXXXXXXX).
export function normalizarTelefono(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.startsWith("0")) digitos = digitos.slice(1);
  if (!digitos.startsWith("54")) digitos = `549${digitos}`;
  if (digitos.length < 11) return null; // demasiado corto para ser válido
  return digitos;
}

// Notifica un evento de negocio según configuracion_alertas: encola y envía
// emails (Resend) y encola WhatsApp (los despacha el worker local). Si el
// evento tiene ambos canales desactivados o faltan plantillas, no hace nada.
// Los errores no se propagan: quedan en email_messages / whatsapp_messages.
export async function notificarEvento({
  eventoCodigo,
  destinatarios,
}: {
  eventoCodigo: string;
  destinatarios: Destinatario[];
}) {
  try {
    const admin = createAdminClient();

    const [{ data: config }, { data: marca }] = await Promise.all([
      admin
        .from("configuracion_alertas")
        .select("nombre, activar_email, plantilla_email, activar_whatsapp, plantilla_whatsapp")
        .eq("evento_codigo", eventoCodigo)
        .maybeSingle(),
      admin.from("configuracion_consultora").select("nombre").eq("id", 1).maybeSingle(),
    ]);
    if (!config) return;

    const nombreConsultora = marca?.nombre || "Notificaciones";

    const porEmail = Boolean(config.activar_email && config.plantilla_email);
    const porWhatsapp = Boolean(config.activar_whatsapp && config.plantilla_whatsapp);
    if (!porEmail && !porWhatsapp) return;

    const emailsVistos = new Set<string>();
    const telefonosVistos = new Set<string>();

    for (const dest of destinatarios) {
      // ---- Canal email ----
      if (porEmail && dest.email && !emailsVistos.has(dest.email)) {
        emailsVistos.add(dest.email);

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
        } else {
          try {
            await enviarEmail({
              to: dest.email,
              subject: config.nombre,
              html: htmlConMarca(cuerpo, nombreConsultora),
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
      }

      // ---- Canal WhatsApp (solo encola; envía el worker local) ----
      if (porWhatsapp && dest.telefono) {
        const numero = normalizarTelefono(dest.telefono);
        if (numero && !telefonosVistos.has(numero)) {
          telefonosVistos.add(numero);

          const { error: errorWa } = await admin.from("whatsapp_messages").insert({
            numero_destino: numero,
            mensaje: renderPlantilla(config.plantilla_whatsapp, dest.variables),
          });
          if (errorWa) {
            console.error(
              `notificarEvento(${eventoCodigo}): no se pudo encolar el WhatsApp`,
              errorWa
            );
          }
        }
      }
    }
  } catch (e) {
    console.error(`notificarEvento(${eventoCodigo}) falló:`, e);
  }
}
