import { createClient } from "@/lib/supabase/server";
import { urlPublicaFlyer } from "@/lib/storage/flyer";

export type Consultora = {
  nombre: string;
  logoUrl: string;
  telefono: string;
  email_contacto: string;
  sitio_web: string;
  logo_path: string | null;
};

const POR_DEFECTO: Consultora = {
  nombre: "Palantiri Consultoras",
  logoUrl: "/logo-palantiri-icon.png",
  telefono: "",
  email_contacto: "",
  sitio_web: "",
  logo_path: null,
};

// Identidad de la consultora dueña de esta instancia (whitelabel).
// Si la tabla todavía no existe o no hay fila, cae a la marca por defecto.
export async function getConsultora(): Promise<Consultora> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("configuracion_consultora")
      .select("nombre, logo_path, telefono, email_contacto, sitio_web")
      .eq("id", 1)
      .maybeSingle();

    if (!data) return POR_DEFECTO;

    return {
      nombre: data.nombre || POR_DEFECTO.nombre,
      logoUrl: data.logo_path ? urlPublicaFlyer(data.logo_path) : POR_DEFECTO.logoUrl,
      telefono: data.telefono ?? "",
      email_contacto: data.email_contacto ?? "",
      sitio_web: data.sitio_web ?? "",
      logo_path: data.logo_path ?? null,
    };
  } catch {
    return POR_DEFECTO;
  }
}
