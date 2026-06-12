import { createClient } from "@/lib/supabase/server";
import { googleConectado, googleConfigurado } from "@/lib/google/oauth";
import {
  actualizarAlerta,
  actualizarEstadoBusqueda,
  actualizarEstadoPostulante,
  desconectarGoogleAction,
} from "./actions";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const { google } = await searchParams;
  const supabase = await createClient();

  const [
    { data: alertas },
    { data: estadosBusqueda },
    { data: estadosPostulante },
    { data: emails },
    hayGoogle,
  ] = await Promise.all([
    supabase.from("configuracion_alertas").select("*").order("evento_codigo"),
    supabase.from("estados_busqueda").select("*").order("orden"),
    supabase.from("estados_postulante").select("*").order("orden"),
    supabase
      .from("email_messages")
      .select("id, destinatario_email, asunto, estado, fecha_creacion, error_log")
      .order("fecha_creacion", { ascending: false })
      .limit(20),
    googleConectado(),
  ]);

  const { data: whatsapps } = await supabase
    .from("whatsapp_messages")
    .select("id, numero_destino, mensaje, estado, fecha_creacion, error_log")
    .order("fecha_creacion", { ascending: false })
    .limit(20);

  const ESTADO_EMAIL_COLOR: Record<string, string> = {
    enviado: "bg-emerald-100 text-emerald-700",
    pendiente: "bg-amber-100 text-amber-700",
    error: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-slate-500">Alertas automáticas y estados del flujo de trabajo.</p>
      </div>

      {google === "conectado" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ Cuenta de Google conectada correctamente.
        </div>
      )}
      {google === "error" && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          ❌ No se pudo conectar con Google. Probá de nuevo o revisá la configuración del cliente OAuth.
        </div>
      )}
      {google === "sin_config" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ Faltan las variables GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en Vercel.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Integración con Google
        </h2>
        {hayGoogle ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-emerald-700">🟢 Cuenta de Google conectada</p>
              <p className="mt-1 text-xs text-slate-500">
                Al agendar una entrevista se crea el evento en Calendar con sala de Meet y se invita
                por email al candidato y al entrevistador.
              </p>
            </div>
            <form action={desconectarGoogleAction}>
              <button
                type="submit"
                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                Desconectar
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700">⚪ Sin conectar</p>
              <p className="mt-1 text-xs text-slate-500">
                Conectá la cuenta de Google de la consultora para crear eventos de Calendar con
                Google Meet automáticamente al agendar entrevistas.
              </p>
            </div>
            {googleConfigurado() ? (
              <a
                href="/api/google/conectar"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Conectar con Google
              </a>
            ) : (
              <p className="text-xs text-amber-600">
                Configurá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vercel para habilitar el botón.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Alertas automáticas
        </h2>
        <div className="space-y-4">
          {(alertas ?? []).map((a) => (
            <details key={a.id} className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer font-medium text-slate-900">{a.nombre}</summary>
              <form action={actualizarAlerta} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={a.id} />
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="activar_email"
                      defaultChecked={a.activar_email}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Enviar por email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="activar_whatsapp"
                      defaultChecked={a.activar_whatsapp}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Enviar por WhatsApp
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Plantilla email</span>
                  <textarea
                    name="plantilla_email"
                    defaultValue={a.plantilla_email}
                    rows={2}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Plantilla WhatsApp</span>
                  <textarea
                    name="plantilla_whatsapp"
                    defaultValue={a.plantilla_whatsapp}
                    rows={2}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </form>
            </details>
          ))}
          {(alertas ?? []).length === 0 && (
            <p className="text-sm text-slate-400">No hay alertas configuradas.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Estados de búsqueda
        </h2>
        <div className="space-y-2">
          {(estadosBusqueda ?? []).map((e) => (
            <form key={e.id} action={actualizarEstadoBusqueda} className="flex items-center gap-3">
              <input type="hidden" name="id" value={e.id} />
              <input
                type="color"
                name="color"
                defaultValue={e.color}
                className="h-9 w-12 rounded-lg border border-slate-200"
              />
              <input
                type="text"
                name="nombre"
                defaultValue={e.nombre}
                readOnly={e.no_borrable}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                type="submit"
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Guardar
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Estados de postulante
        </h2>
        <div className="space-y-2">
          {(estadosPostulante ?? []).map((e) => (
            <form key={e.id} action={actualizarEstadoPostulante} className="flex items-center gap-3">
              <input type="hidden" name="id" value={e.id} />
              <input
                type="color"
                name="color"
                defaultValue={e.color}
                className="h-9 w-12 rounded-lg border border-slate-200"
              />
              <input
                type="text"
                name="nombre"
                defaultValue={e.nombre}
                readOnly={e.no_borrable}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                type="submit"
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Guardar
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Últimos emails enviados
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Destinatario</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Asunto</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(emails ?? []).map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(e.fecha_creacion).toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{e.destinatario_email}</td>
                  <td className="px-3 py-2 text-slate-600">{e.asunto}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_EMAIL_COLOR[e.estado] ?? ""}`}
                      title={e.error_log ?? ""}
                    >
                      {e.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {(emails ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                    Todavía no se enviaron emails automáticos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Últimos WhatsApp
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Los mensajes &quot;pendiente&quot; se envían cuando el worker de WhatsApp está corriendo en
          la PC de la consultora.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Número</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Mensaje</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(whatsapps ?? []).map((w) => (
                <tr key={w.id}>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(w.fecha_creacion).toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{w.numero_destino}</td>
                  <td className="max-w-md truncate px-3 py-2 text-slate-600" title={w.mensaje}>
                    {w.mensaje}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_EMAIL_COLOR[w.estado] ?? ""}`}
                      title={w.error_log ?? ""}
                    >
                      {w.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {(whatsapps ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                    Todavía no se encolaron mensajes de WhatsApp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
