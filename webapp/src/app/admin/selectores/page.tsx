import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eliminarSelector } from "./actions";

const ESTADO_LABEL: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  pausado: "Pausado",
  baja: "Baja",
};

const ESTADO_COLOR: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-700",
  inactivo: "bg-slate-100 text-slate-500",
  pausado: "bg-amber-100 text-amber-700",
  baja: "bg-rose-100 text-rose-700",
};

export default async function SelectoresPage() {
  const supabase = await createClient();
  const { data: selectores } = await supabase
    .from("selectores")
    .select(
      "id, nombre, apellido, email, especializacion, estado, cantidad_postulantes_enviados, cantidad_contratados, comision_porcentaje_defecto"
    )
    .order("nombre");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Selectores</h1>
          <p className="mt-1 text-slate-500">Selectores que trabajan con la consultora.</p>
        </div>
        <Link
          href="/admin/selectores/nuevo"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Nuevo selector
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Especialización</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Enviados</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Contratados</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Comisión</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(selectores ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {s.nombre} {s.apellido}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.email}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{s.especializacion}</td>
                <td className="px-4 py-3 text-slate-600">{s.cantidad_postulantes_enviados}</td>
                <td className="px-4 py-3 text-slate-600">{s.cantidad_contratados}</td>
                <td className="px-4 py-3 text-slate-600">{s.comision_porcentaje_defecto}%</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_COLOR[s.estado] ?? ""}`}>
                    {ESTADO_LABEL[s.estado] ?? s.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/selectores/${s.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Editar
                    </Link>
                    <form action={eliminarSelector}>
                      <input type="hidden" name="id" value={s.id} />
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
            ))}
            {(selectores ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Todavía no hay selectores cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
