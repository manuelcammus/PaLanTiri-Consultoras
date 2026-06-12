import Link from "next/link";
import { getSelectorActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { urlPublicaFlyer } from "@/lib/storage/flyer";
import { responderAsignacion } from "./actions";

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

export default async function PortalBusquedasPage() {
  const selector = await getSelectorActual();
  if (!selector) return null;

  const supabase = await createClient();
  const { data: asignaciones } = await supabase
    .from("asignaciones_busqueda")
    .select(
      "id, estado, fecha_limite_entrega, cantidad_postulantes_esperados, cantidad_postulantes_enviados, cantidad_contratados, perfiles_busqueda(id, titulo_puesto, nivel, areas, ubicacion_puesto, es_remoto, flyer_imagen_path, empresas(nombre))"
    )
    .eq("selector_id", selector.id)
    .order("fecha_asignacion", { ascending: false });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis búsquedas</h1>
        <p className="mt-1 text-slate-500">Búsquedas que te asignó la consultora.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(asignaciones ?? []).map((a) => {
          const perfil = a.perfiles_busqueda as unknown as {
            id: number;
            titulo_puesto: string;
            nivel: string;
            areas: string;
            ubicacion_puesto: string;
            es_remoto: boolean;
            flyer_imagen_path: string | null;
            empresas: { nombre: string } | null;
          } | null;

          return (
            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {perfil?.flyer_imagen_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urlPublicaFlyer(perfil.flyer_imagen_path)}
                  alt={`Flyer de ${perfil.titulo_puesto}`}
                  className="mb-4 max-h-48 w-full rounded-xl border border-slate-100 object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{perfil?.titulo_puesto}</p>
                  <p className="text-sm text-slate-500">{perfil?.empresas?.nombre}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_COLOR[a.estado] ?? ""}`}>
                  {ESTADO_LABEL[a.estado] ?? a.estado}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <p>Nivel: {perfil?.nivel?.replace("_", " ")}</p>
                <p>Área: {perfil?.areas}</p>
                <p>{perfil?.es_remoto ? "Remoto" : perfil?.ubicacion_puesto || "Presencial"}</p>
                <p>Plazo: {a.fecha_limite_entrega ?? "—"}</p>
                <p>Esperados: {a.cantidad_postulantes_esperados}</p>
                <p>Enviados: {a.cantidad_postulantes_enviados}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {a.estado === "nueva" && (
                  <form action={responderAsignacion} className="flex gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      name="accion"
                      value="aceptar"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Aceptar
                    </button>
                    <button
                      type="submit"
                      name="accion"
                      value="rechazar"
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Rechazar
                    </button>
                  </form>
                )}
                {a.estado === "aceptada" && perfil?.id && (
                  <Link
                    href={`/portal/cargar?busqueda=${perfil.id}`}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Cargar postulante
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        {(asignaciones ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 lg:col-span-2">
            Todavía no tenés búsquedas asignadas.
          </div>
        )}
      </div>
    </div>
  );
}
