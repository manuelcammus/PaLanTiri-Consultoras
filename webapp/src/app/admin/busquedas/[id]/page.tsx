import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusquedaForm } from "../busqueda-form";
import { AsignacionesPanel } from "../asignaciones-panel";

export default async function EditarBusquedaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: busqueda } = await supabase
    .from("perfiles_busqueda")
    .select("*")
    .eq("id", id)
    .single();

  if (!busqueda) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar búsqueda</h1>
        <p className="mt-1 text-slate-500">{busqueda.titulo_puesto}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <BusquedaForm busqueda={busqueda} />
      </div>

      <AsignacionesPanel perfilBusquedaId={busqueda.id} />
    </div>
  );
}
