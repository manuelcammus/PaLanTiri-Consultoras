"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notificarEvento } from "@/lib/email/queue";

const fmtMoneda = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function val(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

function nullable(formData: FormData, key: string): string | null {
  const v = val(formData, key);
  return v === "" ? null : v;
}

export async function actualizarComision(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");

  const data = {
    estado_id: nullable(formData, "estado_id"),
    fecha_pago: nullable(formData, "fecha_pago"),
    numero_comprobante: val(formData, "numero_comprobante"),
    metodo_pago: val(formData, "metodo_pago"),
    notas: val(formData, "notas"),
  };

  const { error } = await supabase.from("comisiones").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/comisiones");
  redirect("/admin/comisiones");
}

export async function registrarPago(formData: FormData) {
  const supabase = await createClient();

  const comisionId = val(formData, "comision_id");

  const monto = Number(val(formData, "monto") || "0");

  const { error } = await supabase.from("pagos_comision").insert({
    comision_id: Number(comisionId),
    monto,
    fecha_pago: val(formData, "fecha_pago") || new Date().toISOString().slice(0, 10),
    metodo: val(formData, "metodo") || "transferencia",
    numero_comprobante: val(formData, "numero_comprobante"),
    notas: val(formData, "notas"),
  });
  if (error) throw new Error(error.message);

  const { data: comision } = await supabase
    .from("comisiones")
    .select(
      "selectores!comisiones_selector_id_fkey(nombre, email, telefono), selector_sourcing:selectores!comisiones_selector_sourcing_id_fkey(nombre, email, telefono), postulaciones(postulantes(nombre, apellido), perfiles_busqueda(titulo_puesto, empresas(nombre)))"
    )
    .eq("id", comisionId)
    .single();

  const selector = comision?.selectores as unknown as {
    nombre: string;
    email: string;
    telefono: string;
  } | null;
  const sourcing = comision?.selector_sourcing as unknown as {
    nombre: string;
    email: string;
    telefono: string;
  } | null;
  const postulacion = comision?.postulaciones as unknown as {
    postulantes: { nombre: string; apellido: string } | null;
    perfiles_busqueda: { titulo_puesto: string; empresas: { nombre: string } | null } | null;
  } | null;
  const postulante = postulacion?.postulantes;
  const perfil = postulacion?.perfiles_busqueda;

  const variablesBase = {
    monto_comision: fmtMoneda(monto),
    candidato_nombre: `${postulante?.nombre ?? ""} ${postulante?.apellido ?? ""}`.trim(),
    puesto: perfil?.titulo_puesto ?? "",
    empresa_nombre: perfil?.empresas?.nombre ?? "",
  };

  await notificarEvento({
    eventoCodigo: "comision_pagada",
    destinatarios: [
      { email: selector?.email, nombre: selector?.nombre, telefono: selector?.telefono, variables: { ...variablesBase, nombre_selector: selector?.nombre ?? "" } },
      { email: sourcing?.email, nombre: sourcing?.nombre, telefono: sourcing?.telefono, variables: { ...variablesBase, nombre_selector: sourcing?.nombre ?? "" } },
    ],
  });

  revalidatePath(`/admin/comisiones/${comisionId}`);
}
