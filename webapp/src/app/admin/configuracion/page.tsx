import { createClient } from "@/lib/supabase/server";
import { actualizarAlerta, actualizarEstadoBusqueda, actualizarEstadoPostulante } from "./actions";

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  const [{ data: alertas }, { data: estadosBusqueda }, { data: estadosPostulante }, { data: emails }] =
    await Promise.all([
      supabase.from("configuracion_alertas").select("*").order("evento_codigo"),
      supabase.from("estados_busqueda").select("*").order("orden"),
      supabase.from("estados_postulante").select("*").order("orden"),
      supabase
        .from("email_messages")
        .select("id, destinatario_email, asunto, estado, fecha_creacion, error_log")
        .order("fecha_creacion", { ascending: false })
        .limit(20),
    ]);

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
    </div>
  );
}
