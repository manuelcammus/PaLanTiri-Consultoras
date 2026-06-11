import Link from "next/link";
import { getProfile, getSelectorActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PortalInicio() {
  const profile = await getProfile();
  const selector = await getSelectorActual();

  if (!selector) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold text-amber-900">
          Tu cuenta aún no está vinculada
        </h1>
        <p className="mt-3 text-amber-800">
          Hola {profile?.nombre || profile?.email}. Tu usuario existe pero
          todavía no está asociado a un perfil de selector. Contactá al
          administrador de la consultora para completar la vinculación.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // RLS garantiza que cada consulta devuelve SOLO lo del selector logueado
  const [asignaciones, postulantes, postActivas, comisiones, garantias] =
    await Promise.all([
      supabase
        .from("asignaciones_busqueda")
        .select("*", { count: "exact", head: true })
        .in("estado", ["nueva", "aceptada"]),
      supabase
        .from("postulantes")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("postulaciones")
        .select("*", { count: "exact", head: true })
        .in("estado", [
          "enviada",
          "recibida",
          "entrevista",
          "oferta",
          "aceptada_postulante",
        ]),
      supabase
        .from("comisiones")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("seguimiento_garantia")
        .select("*", { count: "exact", head: true })
        .eq("estado", "vigente"),
    ]);

  const tarjetas = [
    {
      titulo: "Búsquedas activas",
      valor: asignaciones.count ?? 0,
      icono: "🔍",
      href: "/portal/busquedas",
    },
    {
      titulo: "Mis postulantes",
      valor: postulantes.count ?? 0,
      icono: "👥",
      href: "/portal/postulantes",
    },
    {
      titulo: "Postulaciones en proceso",
      valor: postActivas.count ?? 0,
      icono: "📋",
      href: "/portal/postulantes",
    },
    {
      titulo: "Mis comisiones",
      valor: comisiones.count ?? 0,
      icono: "💰",
      href: "/portal/comisiones",
    },
    {
      titulo: "Garantías vigentes",
      valor: garantias.count ?? 0,
      icono: "🛡️",
      href: "/portal/garantias",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Hola, {selector.nombre} 👋
      </h1>
      <p className="mt-1 text-slate-500">
        Este es el resumen de tu actividad como selector.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((t) => (
          <Link
            key={t.titulo}
            href={t.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
              {t.icono}
            </div>
            <p className="text-3xl font-bold text-slate-900">{t.valor}</p>
            <p className="mt-1 text-sm text-slate-500">{t.titulo}</p>
          </Link>
        ))}

        <Link
          href="/portal/cargar"
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 text-center transition hover:bg-emerald-100"
        >
          <span className="text-2xl">➕</span>
          <p className="mt-2 font-semibold text-emerald-800">
            Cargar nuevo postulante
          </p>
          <p className="text-xs text-emerald-600">
            Directo a una de tus búsquedas
          </p>
        </Link>
      </div>
    </div>
  );
}
