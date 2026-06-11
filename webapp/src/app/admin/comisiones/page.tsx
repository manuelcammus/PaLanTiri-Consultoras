import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ComisionesPage() {
  const supabase = await createClient();
  const { data: comisiones } = await supabase
    .from("comisiones")
    .select(
      "id, monto_total, monto_selector, monto_empresa, fecha_calculo, fecha_vencimiento_garantia, empresas(nombre), selectores(nombre, apellido), estados_comision(nombre, color)"
    )
    .order("fecha_calculo", { ascending: false });

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Comisiones</h1>
        <p className="mt-1 text-slate-500">
          Las comisiones se generan automáticamente al marcar una postulación como contratada.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Empresa</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Selector</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Monto total</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Selector recibe</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Empresa recibe</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Vence garantía</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(comisiones ?? []).map((c) => {
              const empresa = c.empresas as unknown as { nombre: string } | null;
              const selector = c.selectores as unknown as { nombre: string; apellido: string } | null;
              const estado = c.estados_comision as unknown as { nombre: string; color: string } | null;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{empresa?.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {selector?.nombre} {selector?.apellido}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmt(c.monto_total)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmt(c.monto_selector)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmt(c.monto_empresa)}</td>
                  <td className="px-4 py-3 text-slate-600">{c.fecha_vencimiento_garantia}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: estado?.color ?? "#8e8e93" }}
                    >
                      {estado?.nombre ?? "Sin estado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/comisiones/${c.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Ver / gestionar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(comisiones ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Todavía no hay comisiones generadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
