"use server";

import { revalidatePath } from "next/cache";
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

export async function actualizarGarantia(formData: FormData) {
  const supabase = await createClient();

  const id = val(formData, "id");
  const nuevoEstado = val(formData, "estado");

  const { data: actual } = await supabase
    .from("seguimiento_garantia")
    .select("estado, postulacion_id")
    .eq("id", id)
    .single();

  const data = {
    estado: nuevoEstado,
    fecha_fin_real: nullable(formData, "fecha_fin_real"),
    motivo_incumplimiento: nullable(formData, "motivo_incumplimiento"),
    notas: val(formData, "notas"),
  };

  const { error } = await supabase.from("seguimiento_garantia").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  if (nuevoEstado === "incumplida" && actual?.estado !== "incumplida" && actual?.postulacion_id) {
    const { data: comision } = await supabase
      .from("comisiones")
      .select(
        "monto_devolucion, selectores!comisiones_selector_id_fkey(nombre, email), selector_sourcing:selectores!comisiones_selector_sourcing_id_fkey(nombre, email), postulaciones(postulantes(nombre, apellido), perfiles_busqueda(titulo_puesto, empresas(nombre)))"
      )
      .eq("postulacion_id", actual.postulacion_id)
      .maybeSingle();

    if (comision) {
      const selector = comision.selectores as unknown as { nombre: string; email: string } | null;
      const sourcing = comision.selector_sourcing as unknown as { nombre: string; email: string } | null;
      const postulacion = comision.postulaciones as unknown as {
        postulantes: { nombre: string; apellido: string } | null;
        perfiles_busqueda: { titulo_puesto: string; empresas: { nombre: string } | null } | null;
      } | null;
      const postulante = postulacion?.postulantes;
      const perfil = postulacion?.perfiles_busqueda;

      const variablesBase = {
        monto_devolucion: fmtMoneda(comision.monto_devolucion ?? 0),
        candidato_nombre: `${postulante?.nombre ?? ""} ${postulante?.apellido ?? ""}`.trim(),
        puesto: perfil?.titulo_puesto ?? "",
        empresa_nombre: perfil?.empresas?.nombre ?? "",
      };

      await notificarEvento({
        eventoCodigo: "garantia_ejecutada",
        destinatarios: [
          { email: selector?.email, nombre: selector?.nombre, variables: { ...variablesBase, nombre_selector: selector?.nombre ?? "" } },
          { email: sourcing?.email, nombre: sourcing?.nombre, variables: { ...variablesBase, nombre_selector: sourcing?.nombre ?? "" } },
        ],
      });
    }
  }

  revalidatePath("/admin/garantias");
}
