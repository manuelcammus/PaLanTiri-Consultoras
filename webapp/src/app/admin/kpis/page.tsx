import { createClient } from "@/lib/supabase/server";

const fmtMoneda = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

function diasEntre(desde: string, hasta: string) {
  return Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000);
}

function promedio(valores: number[]) {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
}

// Devuelve los últimos N meses como claves "YYYY-MM" con etiqueta corta.
function ultimosMeses(n: number) {
  const meses: { clave: string; etiqueta: string }[] = [];
  const hoy = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      clave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      etiqueta: d.toLocaleDateString("es-AR", { month: "short" }),
    });
  }
  return meses;
}

function claveMes(fecha: string) {
  return fecha.slice(0, 7);
}

function Tarjeta({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-400">{detalle}</p>}
    </div>
  );
}

function BarrasMensuales({
  titulo,
  datos,
  formato,
}: {
  titulo: string;
  datos: { etiqueta: string; valor: number }[];
  formato: (n: number) => string;
}) {
  const maximo = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{titulo}</h2>
      <div className="flex h-40 items-end gap-3">
        {datos.map((d) => (
          <div key={d.etiqueta} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium text-slate-600">{d.valor > 0 ? formato(d.valor) : ""}</span>
            <div
              className="w-full rounded-t-lg bg-indigo-500"
              style={{ height: `${Math.max((d.valor / maximo) * 100, d.valor > 0 ? 4 : 0)}%` }}
            />
            <span className="text-xs capitalize text-slate-400">{d.etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function KpisPage() {
  const supabase = await createClient();

  const [
    { data: postulaciones },
    { data: busquedas },
    { data: comisiones },
    { data: pagos },
    { data: garantias },
    { data: postulantes },
  ] = await Promise.all([
    supabase
      .from("postulaciones")
      .select(
        "estado, fecha_envio, fecha_recepcion_empresa, fecha_primera_entrevista, fecha_oferta, fecha_cierre, selector_id, selectores(nombre, apellido)"
      ),
    supabase.from("perfiles_busqueda").select("id, fecha_creacion, fecha_cierre"),
    supabase.from("comisiones").select("monto_total, monto_selector"),
    supabase.from("pagos_comision").select("monto, fecha_pago"),
    supabase.from("seguimiento_garantia").select("estado"),
    supabase.from("postulantes").select("fecha_carga"),
  ]);

  const posts = postulaciones ?? [];

  // ---- Funnel de postulaciones (por fechas alcanzadas) ----
  const funnel = [
    { etapa: "Presentados", cantidad: posts.length },
    { etapa: "Recibidos por empresa", cantidad: posts.filter((p) => p.fecha_recepcion_empresa).length },
    { etapa: "Entrevistados", cantidad: posts.filter((p) => p.fecha_primera_entrevista).length },
    { etapa: "Con oferta", cantidad: posts.filter((p) => p.fecha_oferta).length },
    { etapa: "Contratados", cantidad: posts.filter((p) => p.estado === "contratado").length },
  ];
  const presentados = funnel[0].cantidad;
  const contratados = funnel[4].cantidad;

  // ---- Tiempos ----
  const diasHastaContrato = posts
    .filter((p) => p.estado === "contratado" && p.fecha_cierre)
    .map((p) => diasEntre(p.fecha_envio, p.fecha_cierre!));
  const diasHastaEntrevista = posts
    .filter((p) => p.fecha_primera_entrevista)
    .map((p) => diasEntre(p.fecha_envio, p.fecha_primera_entrevista!));

  // ---- Ranking de selectores ----
  const porSelector = new Map<
    number,
    { nombre: string; presentados: number; entrevistas: number; contratados: number }
  >();
  for (const p of posts) {
    if (!p.selector_id) continue;
    const sel = p.selectores as unknown as { nombre: string; apellido: string } | null;
    const fila = porSelector.get(p.selector_id) ?? {
      nombre: sel ? `${sel.nombre} ${sel.apellido}` : `Selector #${p.selector_id}`,
      presentados: 0,
      entrevistas: 0,
      contratados: 0,
    };
    fila.presentados++;
    if (p.fecha_primera_entrevista) fila.entrevistas++;
    if (p.estado === "contratado") fila.contratados++;
    porSelector.set(p.selector_id, fila);
  }
  const ranking = [...porSelector.values()]
    .sort((a, b) => b.contratados - a.contratados || b.presentados - a.presentados)
    .slice(0, 10);

  // ---- Comisiones ----
  const facturacion = (comisiones ?? []).reduce((a, c) => a + (c.monto_total ?? 0), 0);
  const comisionSelectores = (comisiones ?? []).reduce((a, c) => a + (c.monto_selector ?? 0), 0);
  const pagado = (pagos ?? []).reduce((a, p) => a + (p.monto ?? 0), 0);
  const pendiente = Math.max(0, comisionSelectores - pagado);

  // ---- Series mensuales (últimos 6 meses) ----
  const meses = ultimosMeses(6);
  const pagosPorMes = meses.map((m) => ({
    etiqueta: m.etiqueta,
    valor: (pagos ?? [])
      .filter((p) => p.fecha_pago && claveMes(p.fecha_pago) === m.clave)
      .reduce((a, p) => a + (p.monto ?? 0), 0),
  }));
  const postulantesPorMes = meses.map((m) => ({
    etiqueta: m.etiqueta,
    valor: (postulantes ?? []).filter((p) => claveMes(p.fecha_carga) === m.clave).length,
  }));

  // ---- Garantías ----
  const gars = garantias ?? [];
  const garVigentes = gars.filter((g) => g.estado === "vigente").length;
  const garCompletadas = gars.filter((g) => g.estado === "completada").length;
  const garIncumplidas = gars.filter((g) => g.estado === "incumplida").length;
  const garCerradas = garCompletadas + garIncumplidas;

  // ---- Búsquedas ----
  const busq = busquedas ?? [];
  const busquedasAbiertas = busq.filter((b) => !b.fecha_cierre).length;
  const busquedasCerradas = busq.filter((b) => b.fecha_cierre).length;
  const diasCierreBusqueda = busq
    .filter((b) => b.fecha_cierre)
    .map((b) => diasEntre(b.fecha_creacion, b.fecha_cierre!));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KPIs</h1>
        <p className="mt-1 text-slate-500">Indicadores de rendimiento de la operación.</p>
      </div>

      {/* Indicadores principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta
          titulo="Tasa de colocación"
          valor={presentados ? fmtPct(contratados / presentados) : "—"}
          detalle={`${contratados} contratados de ${presentados} presentados`}
        />
        <Tarjeta
          titulo="Time-to-fill promedio"
          valor={diasHastaContrato.length ? `${Math.round(promedio(diasHastaContrato))} días` : "—"}
          detalle="Desde presentación hasta contratación"
        />
        <Tarjeta
          titulo="Días a primera entrevista"
          valor={diasHastaEntrevista.length ? `${Math.round(promedio(diasHastaEntrevista))} días` : "—"}
          detalle={`Sobre ${diasHastaEntrevista.length} entrevistas`}
        />
        <Tarjeta
          titulo="Búsquedas abiertas"
          valor={String(busquedasAbiertas)}
          detalle={
            diasCierreBusqueda.length
              ? `${busquedasCerradas} cerradas · ${Math.round(promedio(diasCierreBusqueda))} días promedio de cierre`
              : `${busquedasCerradas} cerradas`
          }
        />
      </div>

      {/* Funnel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Funnel de postulaciones
        </h2>
        <div className="space-y-3">
          {funnel.map((f) => (
            <div key={f.etapa} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-sm text-slate-600">{f.etapa}</span>
              <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                <div
                  className="flex h-full items-center rounded-lg bg-indigo-500 px-2 text-xs font-semibold text-white"
                  style={{ width: `${presentados ? Math.max((f.cantidad / presentados) * 100, f.cantidad > 0 ? 6 : 0) : 0}%` }}
                >
                  {f.cantidad > 0 && f.cantidad}
                </div>
              </div>
              <span className="w-14 shrink-0 text-right text-xs text-slate-500">
                {presentados ? fmtPct(f.cantidad / presentados) : "—"}
              </span>
            </div>
          ))}
          {presentados === 0 && (
            <p className="text-sm text-slate-400">Todavía no hay postulaciones registradas.</p>
          )}
        </div>
      </section>

      {/* Comisiones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Facturación por colocaciones" valor={fmtMoneda(facturacion)} detalle="Suma de comisiones generadas" />
        <Tarjeta titulo="Comisiones a selectores" valor={fmtMoneda(comisionSelectores)} />
        <Tarjeta titulo="Pagado a selectores" valor={fmtMoneda(pagado)} />
        <Tarjeta titulo="Pendiente de pago" valor={fmtMoneda(pendiente)} />
      </div>

      {/* Series mensuales */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarrasMensuales
          titulo="Pagos a selectores por mes"
          datos={pagosPorMes}
          formato={(n) => fmtMoneda(n)}
        />
        <BarrasMensuales
          titulo="Postulantes nuevos por mes"
          datos={postulantesPorMes}
          formato={(n) => String(n)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ranking selectores */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Ranking de selectores
          </h2>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="py-2 text-left font-semibold text-slate-600">Selector</th>
                <th className="py-2 text-right font-semibold text-slate-600">Presentados</th>
                <th className="py-2 text-right font-semibold text-slate-600">Entrevistas</th>
                <th className="py-2 text-right font-semibold text-slate-600">Contratados</th>
                <th className="py-2 text-right font-semibold text-slate-600">Conversión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((r) => (
                <tr key={r.nombre}>
                  <td className="py-2 font-medium text-slate-900">{r.nombre}</td>
                  <td className="py-2 text-right text-slate-600">{r.presentados}</td>
                  <td className="py-2 text-right text-slate-600">{r.entrevistas}</td>
                  <td className="py-2 text-right text-slate-600">{r.contratados}</td>
                  <td className="py-2 text-right text-slate-600">
                    {fmtPct(r.contratados / r.presentados)}
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Sin datos de selectores todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Garantías */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Garantías
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-2xl font-bold text-sky-700">{garVigentes}</p>
              <p className="mt-1 text-xs text-sky-600">Vigentes</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-2xl font-bold text-emerald-700">{garCompletadas}</p>
              <p className="mt-1 text-xs text-emerald-600">Completadas</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-4">
              <p className="text-2xl font-bold text-rose-700">{garIncumplidas}</p>
              <p className="mt-1 text-xs text-rose-600">Incumplidas</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Tasa de éxito de garantía:{" "}
            <span className="font-semibold text-slate-900">
              {garCerradas ? fmtPct(garCompletadas / garCerradas) : "— (sin garantías cerradas)"}
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}
