import { createClient } from "@/lib/supabase/server";
import { googleConectado } from "@/lib/google/oauth";
import { agendarEntrevista, registrarResultado, eliminarEntrevista } from "./actions";

const TIPO_LABEL: Record<string, string> = {
  seleccion: "Selección",
  tecnica: "Técnica",
  rrhh: "RRHH",
  final: "Final",
};

const RESULTADO_LABEL: Record<string, string> = {
  no_evaluado: "No evaluado",
  favorable: "Favorable",
  revisar: "A revisar",
  desfavorable: "Desfavorable",
  no_asistio: "No asistió",
};

const RESULTADO_COLOR: Record<string, string> = {
  no_evaluado: "bg-slate-100 text-slate-600",
  favorable: "bg-emerald-100 text-emerald-700",
  revisar: "bg-amber-100 text-amber-700",
  desfavorable: "bg-rose-100 text-rose-700",
  no_asistio: "bg-slate-200 text-slate-600",
};

const TZ_AR = "America/Argentina/Buenos_Aires";

type EntrevistaRow = {
  id: number;
  tipo: string;
  fecha_hora: string;
  duracion_minutos: number;
  entrevistador: string;
  google_meet_url: string | null;
  ubicacion: string;
  realizada: boolean;
  resultado: string;
  comentarios_entrevistador: string;
  postulaciones: {
    postulantes: { nombre: string; apellido: string } | null;
    perfiles_busqueda: { titulo_puesto: string; empresas: { nombre: string } | null } | null;
  } | null;
};

function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: TZ_AR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function descripcionPostulacion(e: EntrevistaRow) {
  const candidato = e.postulaciones?.postulantes;
  const perfil = e.postulaciones?.perfiles_busqueda;
  const nombre = candidato ? `${candidato.nombre} ${candidato.apellido}` : "Candidato eliminado";
  const puesto = perfil
    ? `${perfil.titulo_puesto}${perfil.empresas ? ` — ${perfil.empresas.nombre}` : ""}`
    : "";
  return { nombre, puesto };
}

export default async function EntrevistasPage() {
  const supabase = await createClient();

  const [{ data: entrevistas }, { data: postulacionesActivas }, hayGoogle] = await Promise.all([
    supabase
      .from("entrevistas_agendadas")
      .select(
        `id, tipo, fecha_hora, duracion_minutos, entrevistador, google_meet_url, ubicacion,
         realizada, resultado, comentarios_entrevistador,
         postulaciones(postulantes(nombre, apellido), perfiles_busqueda(titulo_puesto, empresas(nombre)))`
      )
      .order("fecha_hora", { ascending: true }),
    supabase
      .from("postulaciones")
      .select("id, postulantes(nombre, apellido), perfiles_busqueda(titulo_puesto, empresas(nombre))")
      .in("estado", ["enviada", "recibida", "entrevista", "oferta", "aceptada_postulante"])
      .order("fecha_envio", { ascending: false }),
    googleConectado(),
  ]);

  const todas = (entrevistas ?? []) as unknown as EntrevistaRow[];
  const ahora = Date.now();
  const proximas = todas.filter((e) => !e.realizada && new Date(e.fecha_hora).getTime() >= ahora);
  const sinResultado = todas.filter((e) => !e.realizada && new Date(e.fecha_hora).getTime() < ahora);
  const realizadas = todas.filter((e) => e.realizada).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Entrevistas</h1>
        <p className="mt-1 text-slate-500">Agenda de entrevistas y registro de resultados.</p>
      </div>

      {/* Agendar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Agendar entrevista
        </h2>
        <form action={agendarEntrevista} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-3">
            <span className="font-medium text-slate-700">Postulación</span>
            <select
              name="postulacion_id"
              required
              defaultValue=""
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="" disabled>
                Seleccionar candidato y búsqueda
              </option>
              {(postulacionesActivas ?? []).map((p) => {
                const candidato = p.postulantes as unknown as { nombre: string; apellido: string } | null;
                const perfil = p.perfiles_busqueda as unknown as {
                  titulo_puesto: string;
                  empresas: { nombre: string } | null;
                } | null;
                return (
                  <option key={p.id} value={p.id}>
                    {candidato ? `${candidato.nombre} ${candidato.apellido}` : "?"} →{" "}
                    {perfil?.titulo_puesto ?? "?"}
                    {perfil?.empresas ? ` (${perfil.empresas.nombre})` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Tipo</span>
            <select
              name="tipo"
              defaultValue="seleccion"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {Object.entries(TIPO_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Fecha y hora</span>
            <input
              type="datetime-local"
              name="fecha_hora"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Duración (minutos)</span>
            <input
              type="number"
              name="duracion_minutos"
              defaultValue={60}
              min={15}
              step={15}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Entrevistador</span>
            <input
              type="text"
              name="entrevistador"
              placeholder="Nombre o email"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Link de Google Meet (opcional)</span>
            <input
              type="url"
              name="google_meet_url"
              placeholder={hayGoogle ? "Dejar vacío para generarlo automático" : "https://meet.google.com/..."}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Ubicación (si es presencial)</span>
            <input
              type="text"
              name="ubicacion"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-3">
            {hayGoogle ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="crear_meet"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700">
                  Crear evento en Google Calendar con Meet e invitar por email
                </span>
              </label>
            ) : (
              <p className="text-xs text-slate-400">
                💡 Conectá Google en Configuración para crear el evento de Calendar y el Meet automáticamente.
              </p>
            )}
            <button
              type="submit"
              className="ml-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Agendar entrevista
            </button>
          </div>
        </form>
      </section>

      {/* Próximas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Próximas ({proximas.length})
        </h2>
        <div className="space-y-3">
          {proximas.map((e) => {
            const { nombre, puesto } = descripcionPostulacion(e);
            return (
              <div key={e.id} className="rounded-xl border border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {nombre} <span className="font-normal text-slate-500">· {puesto}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      🗓️ {fmtFechaHora(e.fecha_hora)} · {e.duracion_minutos} min ·{" "}
                      {TIPO_LABEL[e.tipo] ?? e.tipo}
                      {e.entrevistador && ` · Entrevista: ${e.entrevistador}`}
                      {e.ubicacion && ` · 📍 ${e.ubicacion}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.google_meet_url && (
                      <a
                        href={e.google_meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        📹 Meet
                      </a>
                    )}
                    <form action={eliminarEntrevista}>
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
          {proximas.length === 0 && (
            <p className="text-sm text-slate-400">No hay entrevistas agendadas a futuro.</p>
          )}
        </div>
      </section>

      {/* Pendientes de resultado */}
      {sinResultado.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-500">
            Pendientes de resultado ({sinResultado.length})
          </h2>
          <div className="space-y-3">
            {sinResultado.map((e) => {
              const { nombre, puesto } = descripcionPostulacion(e);
              return (
                <div key={e.id} className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="font-medium text-slate-900">
                    {nombre} <span className="font-normal text-slate-500">· {puesto}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    🗓️ {fmtFechaHora(e.fecha_hora)} · {TIPO_LABEL[e.tipo] ?? e.tipo}
                    {e.entrevistador && ` · ${e.entrevistador}`}
                  </p>
                  <form
                    action={registrarResultado}
                    className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
                  >
                    <input type="hidden" name="id" value={e.id} />
                    <select
                      name="resultado"
                      required
                      defaultValue=""
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                    >
                      <option value="" disabled>
                        Resultado...
                      </option>
                      {Object.entries(RESULTADO_LABEL)
                        .filter(([v]) => v !== "no_evaluado")
                        .map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      name="comentarios_entrevistador"
                      placeholder="Comentarios del entrevistador"
                      className="min-w-60 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Guardar resultado
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Historial */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Historial ({realizadas.length})
        </h2>
        <div className="space-y-3">
          {realizadas.map((e) => {
            const { nombre, puesto } = descripcionPostulacion(e);
            return (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {nombre} <span className="font-normal text-slate-500">· {puesto}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    🗓️ {fmtFechaHora(e.fecha_hora)} · {TIPO_LABEL[e.tipo] ?? e.tipo}
                    {e.comentarios_entrevistador && ` · "${e.comentarios_entrevistador}"`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${RESULTADO_COLOR[e.resultado] ?? ""}`}
                >
                  {RESULTADO_LABEL[e.resultado] ?? e.resultado}
                </span>
              </div>
            );
          })}
          {realizadas.length === 0 && (
            <p className="text-sm text-slate-400">Todavía no hay entrevistas realizadas.</p>
          )}
        </div>
      </section>
    </div>
  );
}
