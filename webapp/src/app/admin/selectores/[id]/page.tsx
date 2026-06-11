import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SelectorForm } from "../selector-form";

export default async function EditarSelectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: selector } = await supabase
    .from("selectores")
    .select("*")
    .eq("id", id)
    .single();

  if (!selector) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Editar selector</h1>
      <p className="mt-1 text-slate-500">
        {selector.nombre} {selector.apellido}
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectorForm selector={selector} />
      </div>
    </div>
  );
}
