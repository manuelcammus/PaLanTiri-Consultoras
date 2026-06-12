import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostulanteForm } from "../postulante-form";
import { agregarNota, eliminarNota } from "../actions";

const ESTADO_POSTULACION_COLOR: Record<string, string> = {
  enviada: "bg-slate-100 text-slate-600",
  recibida: "bg-sky-100 text-sky-700",
  entrevista: "bg-blue-100 text-blue-700",
  oferta: "bg-violet-100 text-violet-700",
  aceptada_postulante: "bg-amber-100 text-amber-700",
  contratado: "bg-emerald-100 text-emerald-700",
  rechazada_empresa: "bg-rose-100 text-rose-700",
  rechazada_postulante: "bg-rose-100 text-rose-700",
  cancelada: "bg-slate-100 text-slate-500",
};

export default async function EditarPostulantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: postulante }, { data: postulaciones }, { data: notas }] = await Promise.all([
    supabase.from("postulantes").select("*").eq("id", id).single(),
    supabase
      .from("postulaciones")
      .select(
        "id, estado, fecha_envio, fecha_cierre, motivo_rechazo, perfiles_busqueda(titulo_puesto, empresas(nombre)), selectores(nombre, apellido)"
      )
      .eq("postulante_id", id)
      .order("fecha_envio", { ascending: false }),
    supabase
      .from("notas_postulante")
      .select("id, titulo, contenido, fecha_creacion, selectores(nombre, apellido)")
      .eq("postulante_id", id)
      .order("fecha_creacion", { ascending: false }),
  ]);

  if (!postulante) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar postulante</h1>
        <p className="mt-1 text-slate-500">
          {postulante.nombre} {postulante.apellido}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PostulanteForm postulante={postulante} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Historial de búsquedas
        </h2>
        <div className="space-y-3">
          {(postulaciones ?? []).map((po) => {
            const perfil = po.perfiles_busqueda as unknown as {
              titulo_puesto: string;
              empresas: { nombre: string } | null;
            } | null;
            const selector = po.selectores as unknown as { nombre: string; apellido: string } | null;
            return (
              <div
                key={po.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {perfil?.titulo_puesto ?? "Búsqueda eliminada"}
                    {perfil?.empresas && (
                      <span className="font-normal text-slate-500"> — {perfil.empresas.nombre}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Presentado el {new Date(po.fecha_envio).toLocaleDateString("es-AR")}
                    {selector && ` por ${selector.nombre} ${selector.apellido}`}
                    {po.fecha_cierre && ` · cerrada el ${new Date(po.fecha_cierre).toLocaleDateString("es-AR")}`}
                    {po.motivo_rechazo && ` · motivo: ${po.motivo_rechazo}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_POSTULACION_COLOR[po.estado] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {po.estado.replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
          {(postulaciones ?? []).length === 0 && (
            <p className="text-sm text-slate-400">Todavía no fue presentado a ninguna búsqueda.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Notas internas
        </h2>
        <div className="space-y-3">
          {(notas ?? []).map((n) => {
            const autor = n.selectores as unknown as { nombre: string; apellido: string } | null;
            return (
              <div key={n.id} className="rounded-xl border border-slate-100 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {n.titulo && <p className="font-medium text-slate-900">{n.titulo}</p>}
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{n.contenido}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(n.fecha_creacion).toLocaleString("es-AR")}
                      {autor && ` · ${autor.nombre} ${autor.apellido}`}
                    </p>
                  </div>
                  <form action={eliminarNota}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="postulante_id" value={id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Borrar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          {(notas ?? []).length === 0 && (
            <p className="text-sm text-slate-400">Sin notas todavía.</p>
          )}
        </div>

        <form action={agregarNota} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <input type="hidden" name="postulante_id" value={id} />
          <input
            type="text"
            name="titulo"
            placeholder="Título (opcional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <textarea
            name="contenido"
            required
            rows={2}
            placeholder="Escribí una nota sobre este postulante..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Agregar nota
          </button>
        </form>
      </section>
    </div>
  );
}
