import { createAdminClient } from "@/lib/supabase/admin";

const EXTENSIONES_PERMITIDAS = ["pdf", "doc", "docx"];

// Sube un CV al bucket privado "cvs" y devuelve la ruta para guardar en
// postulantes.cv_path. La carpeta agrupa por origen (id de selector o "admin").
export async function subirCv(archivo: File, carpeta: string): Promise<string> {
  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    throw new Error("El CV debe ser PDF o Word (.pdf, .doc, .docx).");
  }

  const ruta = `${carpeta}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("cvs").upload(ruta, archivo, {
    contentType: archivo.type || "application/pdf",
  });
  if (error) throw new Error(`No se pudo subir el CV: ${error.message}`);

  return ruta;
}

// Devuelve una URL firmada (temporal) para ver/descargar un CV del bucket privado.
export async function urlFirmadaCv(
  ruta: string,
  expiraSegundos = 60 * 60
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from("cvs").createSignedUrl(ruta, expiraSegundos);
  return data?.signedUrl ?? null;
}
