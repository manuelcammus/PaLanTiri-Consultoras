"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

// Presenta un postulante del pool a una búsqueda abierta creando la
// postulación. Si ya estaba presentado a esa búsqueda, no duplica.
export async function presentarABusqueda(formData: FormData) {
  const supabase = await createClient();

  const postulanteId = Number(val(formData, "postulante_id"));
  const perfilBusquedaId = Number(val(formData, "perfil_busqueda_id"));
  const filtros = val(formData, "filtros");

  if (!postulanteId || !perfilBusquedaId) return;

  const { data: existente } = await supabase
    .from("postulaciones")
    .select("id")
    .eq("postulante_id", postulanteId)
    .eq("perfil_busqueda_id", perfilBusquedaId)
    .maybeSingle();

  if (existente) {
    redirect(`/admin/talentos?${filtros}&aviso=duplicado`);
  }

  const { data: postulante } = await supabase
    .from("postulantes")
    .select("selector_id")
    .eq("id", postulanteId)
    .single();

  const { error } = await supabase.from("postulaciones").insert({
    postulante_id: postulanteId,
    perfil_busqueda_id: perfilBusquedaId,
    selector_id: postulante?.selector_id ?? null,
    estado: "enviada",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/talentos");
  revalidatePath("/admin/kanban");
  redirect(`/admin/talentos?${filtros}&aviso=presentado`);
}
