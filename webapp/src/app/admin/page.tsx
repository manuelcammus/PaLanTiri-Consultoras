import { createClient } from "@/lib/supabase/server";

function Tarjeta({
  titulo,
  valor,
  icono,
  color,
}: {
  titulo: string;
  valor: number;
  icono: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${color}`}
      >
        {icono}
      </div>
      <p className="text-3xl font-bold text-slate-900">{valor}</p>
      <p className="mt-1 text-sm text-slate-500">{titulo}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };

  const [
    empresas,
    busquedas,
    selectores,
    postulantes,
    postActivas,
    garantias,
  ] = await Promise.all([
    supabase.from("empresas").select("*", head).eq("activa", true),
    supabase.from("perfiles_busqueda").select("*", head).is("fecha_cierre", null),
    supabase.from("selectores").select("*", head).eq("estado", "activo"),
    supabase.from("postulantes").select("*", head),
    supabase
      .from("postulaciones")
      .select("*", head)
      .in("estado", [
        "enviada",
        "recibida",
        "entrevista",
        "oferta",
        "aceptada_postulante",
      ]),
    supabase
      .from("seguimiento_garantia")
      .select("*", head)
      .eq("estado", "vigente"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-slate-500">
        Resumen general de la operación de la consultora.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta
          titulo="Empresas activas"
          valor={empresas.count ?? 0}
          icono="🏢"
          color="bg-indigo-100"
        />
        <Tarjeta
          titulo="Búsquedas abiertas"
          valor={busquedas.count ?? 0}
          icono="🔍"
          color="bg-blue-100"
        />
        <Tarjeta
          titulo="Selectores activos"
          valor={selectores.count ?? 0}
          icono="🧑‍💼"
          color="bg-violet-100"
        />
        <Tarjeta
          titulo="Postulantes en base"
          valor={postulantes.count ?? 0}
          icono="👥"
          color="bg-emerald-100"
        />
        <Tarjeta
          titulo="Postulaciones en proceso"
          valor={postActivas.count ?? 0}
          icono="📋"
          color="bg-amber-100"
        />
        <Tarjeta
          titulo="Garantías vigentes"
          valor={garantias.count ?? 0}
          icono="🛡️"
          color="bg-rose-100"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-slate-500">
          ¿Querés ver el funnel de conversión, el ranking de selectores y las series mensuales?
        </p>
        <a
          href="/admin/kpis"
          className="mt-3 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          📈 Ver panel de KPIs
        </a>
      </div>
    </div>
  );
}
