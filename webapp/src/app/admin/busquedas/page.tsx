import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eliminarBusqueda } from "./actions";

export default async function BusquedasPage() {
  const supabase = await createClient();
  const { data: busquedas } = await supabase
    .from("perfiles_busqueda")
    .select(
      "id, titulo_puesto, nivel, prioridad, cantidad_posiciones, fecha_creacion, empresas(nombre), estados_busqueda(nombre, color), selectores(nombre, apellido)"
    )
    .order("fecha_creacion", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Búsquedas</h1>
          <p className="mt-1 text-slate-500">Búsquedas de personal en curso y finalizadas.</p>
        </div>
        <Link
          href="/admin/busquedas/nueva"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Nueva búsqueda
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Puesto</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Empresa</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Nivel</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Prioridad</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Posiciones</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Selector</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(busquedas ?? []).map((b) => {
              const row = b as unknown as {
                empresas: { nombre: string } | null;
                estados_busqueda: { nombre: string; color: string } | null;
                selectores: { nombre?: string; apellido?: string } | null;
              };
              const empresa = row.empresas?.nombre ?? "—";
              const estado = row.estados_busqueda;
              const selector = row.selectores;
              const selectorNombre = selector
                ? `${selector.nombre ?? ""} ${selector.apellido ?? ""}`.trim()
                : "Sin asignar";

              return (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{b.titulo_puesto}</td>
                  <td className="px-4 py-3 text-slate-600">{empresa}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{b.nivel?.replace("_", " ")}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{b.prioridad}</td>
                  <td className="px-4 py-3 text-slate-600">{b.cantidad_posiciones}</td>
                  <td className="px-4 py-3 text-slate-600">{selectorNombre}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: estado?.color ?? "#8e8e93" }}
                    >
                      {estado?.nombre ?? "Sin estado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/busquedas/${b.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        Editar
                      </Link>
                      <form action={eliminarBusqueda}>
                        <input type="hidden" name="id" value={b.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(busquedas ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Todavía no hay búsquedas cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
