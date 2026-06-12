// Extrae el texto plano de un CV (PDF o Word) para indexarlo en
// postulantes.cv_texto_extraido y que la búsqueda libre de la base de
// talentos encuentre por contenido. Nunca lanza: si falla, devuelve "".

const MAX_CARACTERES = 100_000;

export async function extraerTextoCv(archivo: File): Promise<string> {
  try {
    const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
    const buffer = Buffer.from(await archivo.arrayBuffer());

    if (extension === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return text.replace(/\s+/g, " ").trim().slice(0, MAX_CARACTERES);
    }

    if (extension === "docx") {
      const mammothMod = await import("mammoth");
      const mammoth =
        (mammothMod as unknown as { default?: typeof mammothMod }).default ?? mammothMod;
      const { value } = await mammoth.extractRawText({ buffer });
      return value.replace(/\s+/g, " ").trim().slice(0, MAX_CARACTERES);
    }

    // .doc binario antiguo: sin soporte de extracción, se guarda igual el archivo
    return "";
  } catch (e) {
    console.error("extraerTextoCv falló:", e);
    return "";
  }
}
