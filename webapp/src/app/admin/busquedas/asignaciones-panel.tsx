import { createClient } from "@/lib/supabase/server";
import { asignarSelector, eliminarAsignacion } from "./actions";

const ESTADO_LABEL: Record<string, string> = {
  nueva: "Nueva",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  completada: "Completada",
  cancelada: "Cancelada",
};

const ESTADO_COLOR: Record<string, string> = {
  nueva: "bg-amber-100 text-amber-700",
  aceptada: "bg-emerald-100 text-emerald-700",
  rechazada: "bg-rose-100 text-rose-700",
  completada: "bg-slate-100 text-slate-500",
  cancelada: "bg-slate-100 text-slate-500",
};

export async function AsignacionesPanel({ perfilBusquedaId }: { perfilBusquedaId: number }) {
  const supabase = await createClient();

  const [{ data: asignaciones }, { data: selectores }] = await Promise.all([
    supabase
      .from("asignaciones_busqueda")
      .select(
        "id, estado, fecha_limite_entrega, cantidad_postulantes_esperados, cantidad_postulantes_enviados, cantidad_contratados, selectores(id, nombre, apellido)"
      )
      .eq("perfil_busqueda_id", perfilBusquedaId)
      .order("fecha_asignacion", { ascending: false }),
    supabase.from("selectores").select("id, nombre, apellido").eq("estado", "activo").order("nombre"),
  ]);

  const asignados = (asignaciones ?? []).map((a) => {
    const selector = a.selectores as unknown as { id: number; nombre: string; apellido: string } | null;
    return { ...a, selector };
  });

  const idsAsignados = new Set(asignados.map((a) => a.selector?.id));
  const disponibles = (selectores ?? []).filter((s) => !idsAsignados.has(s.id));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Selectores asignados
      </h2>

      <div className="space-y-3">
        {asignados.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3"
          >
            <div>
              <p className="font-medium text-slate-900">
                {a.selector?.nombre} {a.selector?.apellido}
              </p>
              <p className="text-xs text-slate-500">
                Esperados: {a.cantidad_postulantes_esperados} · Enviados: {a.cantidad_postulantes_enviados} ·
                Contratados: {a.cantidad_contratados}
                {a.fecha_limite_entrega && <> · Plazo: {a.fecha_limite_entrega}</>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_COLOR[a.estado] ?? ""}`}>
                {ESTADO_LABEL[a.estado] ?? a.estado}
              </span>
              <form action={eliminarAsignacion}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="perfil_busqueda_id" value={perfilBusquedaId} />
                <button
                  type="submit"
                  className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Quitar
                </button>
              </form>
            </div>
          </div>
        ))}
        {asignados.length === 0 && (
          <p className="text-sm text-slate-400">Esta búsqueda todavía no tiene selectores asignados.</p>
        )}
      </div>

      {disponibles.length > 0 && (
        <form action={asignarSelector} className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <input type="hidden" name="perfil_busqueda_id" value={perfilBusquedaId} />
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Selector</span>
            <select
              name="selector_id"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="" disabled selected>
                Seleccionar selector
              </option>
              {disponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} {s.apellido}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Postulantes esperados</span>
            <input
              type="number"
              name="cantidad_postulantes_esperados"
              defaultValue={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Fecha límite</span>
            <input
              type="date"
              name="fecha_limite_entrega"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Asignar selector
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
