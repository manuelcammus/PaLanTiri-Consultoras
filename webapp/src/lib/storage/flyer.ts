import { createAdminClient } from "@/lib/supabase/admin";

const EXTENSIONES_PERMITIDAS = ["png", "jpg", "jpeg", "webp"];

// Sube una imagen al bucket público "flyers" y devuelve su ruta.
// Se usa para flyers de búsquedas (carpeta busquedas/) y para el logo de la
// consultora (carpeta branding/).
export async function subirFlyer(archivo: File, carpeta = "busquedas"): Promise<string> {
  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    throw new Error("La imagen debe ser PNG, JPG o WebP.");
  }

  const ruta = `${carpeta}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("flyers").upload(ruta, archivo, {
    contentType: archivo.type || "image/png",
  });
  if (error) throw new Error(`No se pudo subir el flyer: ${error.message}`);

  return ruta;
}

// El bucket es público: la URL se arma directo, sin firma.
export function urlPublicaFlyer(ruta: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/flyers/${ruta}`;
}
