import { createClient } from "@/lib/supabase/server";
import { moverPostulacion } from "./actions";

const COLUMNAS: { estado: string; label: string; color: string }[] = [
  { estado: "enviada", label: "Enviada", color: "#007aff" },
  { estado: "recibida", label: "Recibida", color: "#5856d6" },
  { estado: "entrevista", label: "Entrevista", color: "#af52de" },
  { estado: "oferta", label: "Oferta", color: "#ff9500" },
  { estado: "aceptada_postulante", label: "Aceptada", color: "#34c759" },
  { estado: "contratado", label: "Contratado", color: "#30d158" },
  { estado: "rechazada_empresa", label: "Rechazada (empresa)", color: "#ff3b30" },
  { estado: "rechazada_postulante", label: "Rechazada (postulante)", color: "#ff3b30" },
  { estado: "cancelada", label: "Cancelada", color: "#8e8e93" },
];

const ESTADOS_VALORES = COLUMNAS.map((c) => c.estado);

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ busqueda?: string }>;
}) {
  const { busqueda: busquedaId } = await searchParams;
  const supabase = await createClient();

  const [{ data: busquedas }, postulacionesQuery] = await Promise.all([
    supabase
      .from("perfiles_busqueda")
      .select("id, titulo_puesto, empresas(nombre)")
      .is("fecha_cierre", null)
      .order("fecha_creacion", { ascending: false }),
    (async () => {
      let query = supabase
        .from("postulaciones")
        .select(
          "id, estado, postulantes(nombre, apellido, titulo_principal), perfiles_busqueda(titulo_puesto, empresas(nombre))"
        )
        .order("fecha_envio", { ascending: false });

      if (busquedaId) query = query.eq("perfil_busqueda_id", busquedaId);

      return query;
    })(),
  ]);

  const postulaciones = postulacionesQuery.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tablero Kanban</h1>
          <p className="mt-1 text-slate-500">Seguimiento de postulaciones por etapa.</p>
        </div>
        <form className="flex items-center gap-2">
          <select
            name="busqueda"
            defaultValue={busquedaId ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Todas las búsquedas</option>
            {(busquedas ?? []).map((b) => {
              const empresa = b.empresas as unknown as { nombre: string } | null;
              return (
                <option key={b.id} value={b.id}>
                  {b.titulo_puesto} — {empresa?.nombre ?? ""}
                </option>
              );
            })}
          </select>
          <button
            type="submit"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Filtrar
          </button>
        </form>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {COLUMNAS.map((col) => {
          const items = postulaciones.filter((p) => p.estado === col.estado);
          return (
            <div key={col.estado} className="w-72 shrink-0">
              <div
                className="mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: col.color }}
              >
                <span>{col.label}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{items.length}</span>
              </div>

              <div className="flex flex-col gap-3">
                {items.map((p) => {
                  const postulante = p.postulantes as unknown as {
                    nombre: string;
                    apellido: string;
                    titulo_principal: string;
                  } | null;
                  const perfil = p.perfiles_busqueda as unknown as {
                    titulo_puesto: string;
                    empresas: { nombre: string } | null;
                  } | null;

                  return (
                    <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="font-semibold text-slate-900">
                        {postulante?.nombre} {postulante?.apellido}
                      </p>
                      <p className="text-xs text-slate-500">{postulante?.titulo_principal}</p>
                      <p className="mt-2 text-sm text-slate-700">{perfil?.titulo_puesto}</p>
                      <p className="text-xs text-slate-500">{perfil?.empresas?.nombre}</p>

                      <form action={moverPostulacion} className="mt-3 flex gap-2">
                        <input type="hidden" name="id" value={p.id} />
                        <select
                          name="estado"
                          defaultValue={p.estado}
                          className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          {ESTADOS_VALORES.map((e) => (
                            <option key={e} value={e}>
                              {COLUMNAS.find((c) => c.estado === e)?.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Mover
                        </button>
                      </form>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    Sin postulaciones
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
