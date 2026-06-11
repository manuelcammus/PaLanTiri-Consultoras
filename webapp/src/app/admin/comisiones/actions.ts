"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("pagos_comision").insert({
    comision_id: Number(comisionId),
    monto: Number(val(formData, "monto") || "0"),
    fecha_pago: val(formData, "fecha_pago") || new Date().toISOString().slice(0, 10),
    metodo: val(formData, "metodo") || "transferencia",
    numero_comprobante: val(formData, "numero_comprobante"),
    notas: val(formData, "notas"),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/comisiones/${comisionId}`);
}
