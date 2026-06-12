"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSelectorActual } from "@/lib/auth";
import { subirCv } from "@/lib/storage/cv";

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

function nullable(formData: FormData, key: string): string | null {
  const v = val(formData, key);
  return v === "" ? null : v;
}

export async function cargarPostulante(formData: FormData) {
  const selector = await getSelectorActual();
  if (!selector) throw new Error("No hay un selector vinculado a este usuario.");

  const supabase = await createClient();
  const perfilBusquedaId = Number(val(formData, "perfil_busqueda_id"));

  // Crear o reutilizar el postulante por email
  const email = val(formData, "email");
  const { data: existente } = await supabase
    .from("postulantes")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let postulanteId: number;

  const cv = formData.get("cv") as File | null;
  const cvPath = cv && cv.size > 0 ? await subirCv(cv, String(selector.id)) : null;

  const datosPostulante = {
    ...(cvPath ? { cv_path: cvPath } : {}),
    nombre: val(formData, "nombre"),
    apellido: val(formData, "apellido"),
    email,
    telefono: val(formData, "telefono"),
    ciudad: val(formData, "ciudad"),
    titulo_principal: val(formData, "titulo_principal"),
    resumen_profesional: val(formData, "resumen_profesional"),
    experiencia_anos: Number(val(formData, "experiencia_anos") || "0"),
    habilidades: val(formData, "habilidades"),
    salario_pretendido_minimo: nullable(formData, "salario_pretendido_minimo"),
    salario_pretendido_maximo: nullable(formData, "salario_pretendido_maximo"),
    linkedin_url: nullable(formData, "linkedin_url"),
    selector_id: selector.id,
  };

  if (existente) {
    postulanteId = existente.id;
    const { error } = await supabase.from("postulantes").update(datosPostulante).eq("id", postulanteId);
    if (error) throw new Error(error.message);
  } else {
    const { data: nuevo, error } = await supabase
      .from("postulantes")
      .insert(datosPostulante)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    postulanteId = nuevo.id;
  }

  // Crear la postulación a la búsqueda (si ya existe, no duplicar)
  const { data: postExistente } = await supabase
    .from("postulaciones")
    .select("id")
    .eq("postulante_id", postulanteId)
    .eq("perfil_busqueda_id", perfilBusquedaId)
    .maybeSingle();

  if (!postExistente) {
    const { error } = await supabase.from("postulaciones").insert({
      postulante_id: postulanteId,
      perfil_busqueda_id: perfilBusquedaId,
      selector_id: selector.id,
      estado: "enviada",
    });
    if (error) throw new Error(error.message);
  }

  redirect("/portal/postulantes?ok=1");
}
