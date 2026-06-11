import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarComision, registrarPago } from "../actions";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default async function ComisionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: comision }, { data: estados }, { data: pagos }] = await Promise.all([
    supabase
      .from("comisiones")
      .select(
        "*, empresas(nombre), selectores(nombre, apellido), selector_sourcing:selector_sourcing_id(nombre, apellido)"
      )
      .eq("id", id)
      .single(),
    supabase.from("estados_comision").select("id, nombre").order("id"),
    supabase.from("pagos_comision").select("*").eq("comision_id", id).order("fecha_pago", { ascending: false }),
  ]);

  if (!comision) notFound();

  const empresa = comision.empresas as unknown as { nombre: string } | null;
  const selector = comision.selectores as unknown as { nombre: string; apellido: string } | null;
  const sourcing = comision.selector_sourcing as unknown as { nombre: string; apellido: string } | null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Comisión #{comision.id}</h1>
        <p className="mt-1 text-slate-500">
          {empresa?.nombre} — {selector?.nombre} {selector?.apellido}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Detalle del cálculo</h2>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-500">Salario mensual</p>
            <p className="font-semibold text-slate-900">{fmt(comision.salario_mensual)}</p>
          </div>
          <div>
            <p className="text-slate-500">% comisión empresa</p>
            <p className="font-semibold text-slate-900">{comision.comision_porcentaje_empresa}%</p>
          </div>
          <div>
            <p className="text-slate-500">Monto total</p>
            <p className="font-semibold text-slate-900">{fmt(comision.monto_total)}</p>
          </div>
          <div>
            <p className="text-slate-500">Sourcing ({comision.porcentaje_sourcing}%)</p>
            <p className="font-semibold text-slate-900">{fmt(comision.monto_sourcing)}</p>
            {sourcing && (
              <p className="text-xs text-slate-400">
                {sourcing.nombre} {sourcing.apellido}
              </p>
            )}
          </div>
          <div>
            <p className="text-slate-500">Cierre ({comision.porcentaje_cierre}%)</p>
            <p className="font-semibold text-slate-900">{fmt(comision.monto_cierre)}</p>
          </div>
          <div>
            <p className="text-slate-500">Total selector</p>
            <p className="font-semibold text-slate-900">{fmt(comision.monto_selector)}</p>
          </div>
          <div>
            <p className="text-slate-500">Queda para la consultora</p>
            <p className="font-semibold text-slate-900">{fmt(comision.monto_empresa)}</p>
          </div>
          <div>
            <p className="text-slate-500">Vencimiento de garantía</p>
            <p className="font-semibold text-slate-900">{comision.fecha_vencimiento_garantia}</p>
          </div>
          {comision.aplica_clawback && (
            <div>
              <p className="text-slate-500">Devolución por clawback</p>
              <p className="font-semibold text-rose-600">{fmt(comision.monto_devolucion)}</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Estado y pago</h2>
        <form action={actualizarComision} className="space-y-4">
          <input type="hidden" name="id" value={comision.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Estado</span>
              <select
                name="estado_id"
                defaultValue={comision.estado_id ?? ""}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {(estados ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Fecha de pago</span>
              <input
                type="date"
                name="fecha_pago"
                defaultValue={comision.fecha_pago ?? ""}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Método de pago</span>
              <input
                type="text"
                name="metodo_pago"
                defaultValue={comision.metodo_pago ?? ""}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">N° de comprobante</span>
              <input
                type="text"
                name="numero_comprobante"
                defaultValue={comision.numero_comprobante ?? ""}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Notas</span>
            <textarea
              name="notas"
              defaultValue={comision.notas ?? ""}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Guardar
            </button>
            <a
              href="/admin/comisiones"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Volver
            </a>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Registrar pago parcial
        </h2>
        <form action={registrarPago} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="comision_id" value={comision.id} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Monto</span>
            <input
              type="number"
              name="monto"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Fecha</span>
            <input
              type="date"
              name="fecha_pago"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Método</span>
            <select
              name="metodo"
              defaultValue="transferencia"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">N° de comprobante</span>
            <input
              type="text"
              name="numero_comprobante"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Registrar pago
            </button>
          </div>
        </form>

        {(pagos ?? []).length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Fecha</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Monto</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Método</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(pagos ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 text-slate-600">{p.fecha_pago}</td>
                    <td className="px-3 py-2 text-slate-600">{fmt(p.monto)}</td>
                    <td className="px-3 py-2 capitalize text-slate-600">{p.metodo}</td>
                    <td className="px-3 py-2 text-slate-600">{p.numero_comprobante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
