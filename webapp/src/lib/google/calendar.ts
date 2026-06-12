import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessToken } from "./oauth";

const TZ_AR = "America/Argentina/Buenos_Aires";

async function log(operation: string, status: string, message = "") {
  const admin = createAdminClient();
  await admin
    .from("google_logs")
    .insert({ service: "calendar", operation, status, message })
    .then(() => {});
}

// Crea el evento de la entrevista en el calendario principal de la cuenta
// conectada, con sala de Google Meet e invitaciones por email. Devuelve null
// si no hay cuenta conectada o si Google falla (la entrevista se agenda igual).
export async function crearEventoEntrevista({
  titulo,
  descripcion,
  inicio,
  duracionMinutos,
  invitados,
}: {
  titulo: string;
  descripcion: string;
  inicio: string; // ISO con offset
  duracionMinutos: number;
  invitados: string[];
}): Promise<{ eventId: string; meetUrl: string | null } | null> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    const fin = new Date(new Date(inicio).getTime() + duracionMinutos * 60_000).toISOString();

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: titulo,
          description: descripcion,
          start: { dateTime: inicio, timeZone: TZ_AR },
          end: { dateTime: fin, timeZone: TZ_AR },
          attendees: invitados.filter((e) => e.includes("@")).map((email) => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      await log("crear_evento", "error", `${res.status}: ${(await res.text()).slice(0, 500)}`);
      return null;
    }

    const evento = await res.json();
    await log("crear_evento", "ok", `${titulo} → ${evento.id}`);
    return { eventId: evento.id, meetUrl: evento.hangoutLink ?? null };
  } catch (e) {
    await log("crear_evento", "error", String(e).slice(0, 500));
    return null;
  }
}

// Borra el evento del calendario (al cancelar la entrevista). Nunca lanza.
export async function eliminarEvento(eventId: string): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
      { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      await log("eliminar_evento", "error", `${res.status}: ${(await res.text()).slice(0, 500)}`);
      return;
    }
    await log("eliminar_evento", "ok", eventId);
  } catch (e) {
    await log("eliminar_evento", "error", String(e).slice(0, 500));
  }
}
