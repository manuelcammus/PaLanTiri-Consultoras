import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { urlFirmadaCv } from "@/lib/storage/cv";
import { presentarABusqueda } from "./actions";

type Filtros = {
  q?: string;
  exp_min?: string;
  provincia?: string;
  ciudad?: string;
  estado?: string;
  modalidad?: string;
  salario?: string;
  mudanza?: string;
  pool?: string;
  aviso?: string;
};

const fmtMoneda = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const CAMPOS_TEXTO = [
  "nombre",
  "apellido",
  "email",
  "titulo_principal",
  "habilidades",
  "resumen_profesional",
  "titulaciones",
  "idiomas",
  "ciudad",
  "cv_texto_extraido",
];

export default async function TalentosPage({
  searchParams,
}: {
  searchParams: Promise<Filtros>;
}) {
  const filtros = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("postulantes")
    .select(
      `id, nombre, apellido, email, telefono, titulo_principal, resumen_profesional,
       experiencia_anos, habilidades, idiomas, provincia, ciudad, disponibilidad_mudanza,
       salario_pretendido_minimo, salario_pretendido_maximo,
       acepta_remoto, acepta_hibrido, acepta_presencial,
       cv_path, linkedin_url, fecha_carga, guardado_en_pool,
       estados_postulante(nombre, color),
       postulaciones(id, estado, perfiles_busqueda(titulo_puesto, empresas(nombre)))`
    )
    .order("fecha_carga", { ascending: false })
    .limit(60);

  const texto = (filtros.q ?? "").replace(/[,()]/g, " ").trim();
  if (texto) {
    query = query.or(CAMPOS_TEXTO.map((c) => `${c}.ilike.%${texto}%`).join(","));
  }
  if (filtros.exp_min) query = query.gte("experiencia_anos", Number(filtros.exp_min));
  if (filtros.provincia) query = query.ilike("provincia", `%${filtros.provincia}%`);
  if (filtros.ciudad) query = query.ilike("ciudad", `%${filtros.ciudad}%`);
  if (filtros.estado) query = query.eq("estado_id", Number(filtros.estado));
  if (filtros.modalidad === "remoto") query = query.eq("acepta_remoto", true);
  if (filtros.modalidad === "hibrido") query = query.eq("acepta_hibrido", true);
  if (filtros.modalidad === "presencial") query = query.eq("acepta_presencial", true);
  if (filtros.salario) {
    query = query.or(
      `salario_pretendido_minimo.is.null,salario_pretendido_minimo.lte.${Number(filtros.salario)}`
    );
  }
  if (filtros.mudanza === "on") query = query.eq("disponibilidad_mudanza", true);
  if (filtros.pool === "on") query = query.eq("guardado_en_pool", true);

  const [{ data: postulantes }, { data: estados }, { data: busquedasAbiertas }] =
    await Promise.all([
      query,
      supabase.from("estados_postulante").select("id, nombre").order("orden"),
      supabase
        .from("perfiles_busqueda")
        .select("id, titulo_puesto, empresas(nombre)")
        .is("fecha_cierre", null)
        .order("fecha_creacion", { ascending: false }),
    ]);

  const cvUrls = await Promise.all(
    (postulantes ?? []).map((p) => (p.cv_path ? urlFirmadaCv(p.cv_path, 1800) : Promise.resolve(null)))
  );

  // Para que las acciones vuelvan a esta misma vista con los filtros aplicados
  const paramsActuales = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v && k !== "aviso") paramsActuales.set(k, v);
  }
  const filtrosStr = paramsActuales.toString();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Base de talentos</h1>
        <p className="mt-1 text-slate-500">
          Buscá perfiles ya presentados y reutilizalos en nuevas búsquedas.
        </p>
      </div>

      {filtros.aviso === "presentado" && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ Postulante presentado a la búsqueda correctamente.
        </div>
      )}
      {filtros.aviso === "duplicado" && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ Ese postulante ya estaba presentado a esa búsqueda.
        </div>
      )}

      {/* Filtros */}
      <form
        method="get"
        className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Búsqueda libre</span>
          <input
            type="text"
            name="q"
            defaultValue={filtros.q ?? ""}
            placeholder="Nombre, título, habilidad, texto del CV..."
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Experiencia mínima (años)</span>
          <input
            type="number"
            name="exp_min"
            min={0}
            defaultValue={filtros.exp_min ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Estado</span>
          <select
            name="estado"
            defaultValue={filtros.estado ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Todos</option>
            {(estados ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Provincia</span>
          <input
            type="text"
            name="provincia"
            defaultValue={filtros.provincia ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Ciudad</span>
          <input
            type="text"
            name="ciudad"
            defaultValue={filtros.ciudad ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Modalidad aceptada</span>
          <select
            name="modalidad"
            defaultValue={filtros.modalidad ?? ""}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Cualquiera</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
            <option value="presencial">Presencial</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Presupuesto mensual (hasta)</span>
          <input
            type="number"
            name="salario"
            min={0}
            defaultValue={filtros.salario ?? ""}
            placeholder="Filtra por pretensión salarial"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <div className="flex flex-wrap items-end gap-4 sm:col-span-2 lg:col-span-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="mudanza"
              defaultChecked={filtros.mudanza === "on"}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-700">Con disponibilidad de mudanza</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="pool"
              defaultChecked={filtros.pool === "on"}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-700">Solo guardados en pool</span>
          </label>
          <div className="ml-auto flex gap-2">
            <Link
              href="/admin/talentos"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Limpiar
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Filtrar
            </button>
          </div>
        </div>
      </form>

      {/* Resultados */}
      <p className="mt-6 text-sm text-slate-500">
        {(postulantes ?? []).length} perfil{(postulantes ?? []).length === 1 ? "" : "es"} encontrado
        {(postulantes ?? []).length === 1 ? "" : "s"}
        {(postulantes ?? []).length === 60 && " (mostrando los 60 más recientes — refiná los filtros)"}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(postulantes ?? []).map((p, i) => {
          const estado = p.estados_postulante as unknown as { nombre: string; color: string } | null;
          const postulaciones = (p.postulaciones ?? []) as unknown as {
            id: number;
            estado: string;
            perfiles_busqueda: { titulo_puesto: string; empresas: { nombre: string } | null } | null;
          }[];
          const habilidades = (p.habilidades ?? "")
            .split(/[,;]/)
            .map((h: string) => h.trim())
            .filter(Boolean)
            .slice(0, 8);
          const modalidades = [
            p.acepta_remoto && "Remoto",
            p.acepta_hibrido && "Híbrido",
            p.acepta_presencial && "Presencial",
          ].filter(Boolean) as string[];
          const cvUrl = cvUrls[i];

          return (
            <div key={p.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {p.nombre} {p.apellido}
                  </p>
                  <p className="text-sm text-slate-600">{p.titulo_principal || "Sin título registrado"}</p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: estado?.color ?? "#8e8e93" }}
                >
                  {estado?.nombre ?? "Sin estado"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>📍 {[p.ciudad, p.provincia].filter(Boolean).join(", ") || "Sin ubicación"}</span>
                <span>💼 {p.experiencia_anos} años de experiencia</span>
                {p.salario_pretendido_minimo != null && (
                  <span>
                    💵 {fmtMoneda(p.salario_pretendido_minimo)}
                    {p.salario_pretendido_maximo != null && ` – ${fmtMoneda(p.salario_pretendido_maximo)}`}
                  </span>
                )}
                {p.disponibilidad_mudanza && <span>🚚 Acepta mudanza</span>}
                {modalidades.length > 0 && <span>🏠 {modalidades.join(" · ")}</span>}
                {p.idiomas && <span>🗣️ {p.idiomas}</span>}
              </div>

              {habilidades.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {habilidades.map((h: string) => (
                    <span
                      key={h}
                      className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {postulaciones.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  🔁 Presentado en {postulaciones.length} búsqueda{postulaciones.length === 1 ? "" : "s"}:{" "}
                  {postulaciones
                    .slice(0, 3)
                    .map(
                      (po) =>
                        `${po.perfiles_busqueda?.titulo_puesto ?? "?"} (${po.estado.replace(/_/g, " ")})`
                    )
                    .join(" · ")}
                  {postulaciones.length > 3 && ` · +${postulaciones.length - 3} más`}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                {cvUrl && (
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    📄 Ver CV
                  </a>
                )}
                {p.linkedin_url && (
                  <a
                    href={p.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                  >
                    in LinkedIn
                  </a>
                )}
                <Link
                  href={`/admin/postulantes/${p.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Ver ficha
                </Link>

                {(busquedasAbiertas ?? []).length > 0 && (
                  <form action={presentarABusqueda} className="ml-auto flex items-center gap-2">
                    <input type="hidden" name="postulante_id" value={p.id} />
                    <input type="hidden" name="filtros" value={filtrosStr} />
                    <select
                      name="perfil_busqueda_id"
                      required
                      defaultValue=""
                      className="max-w-52 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                    >
                      <option value="" disabled>
                        Elegir búsqueda...
                      </option>
                      {(busquedasAbiertas ?? []).map((b) => {
                        const empresa = b.empresas as unknown as { nombre: string } | null;
                        return (
                          <option key={b.id} value={b.id}>
                            {b.titulo_puesto}
                            {empresa ? ` — ${empresa.nombre}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Presentar
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {(postulantes ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400 xl:col-span-2">
            No se encontraron perfiles con esos filtros.
          </div>
        )}
      </div>
    </div>
  );
}
