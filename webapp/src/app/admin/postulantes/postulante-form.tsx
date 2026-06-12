import { createClient } from "@/lib/supabase/server";
import { urlFirmadaCv } from "@/lib/storage/cv";
import { guardarPostulante } from "./actions";

type Postulante = {
  id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  pais?: string;
  provincia?: string;
  ciudad?: string;
  disponibilidad_mudanza?: boolean;
  titulo_principal?: string;
  resumen_profesional?: string;
  experiencia_anos?: number;
  habilidades?: string;
  idiomas?: string;
  salario_pretendido_minimo?: number | null;
  salario_pretendido_maximo?: number | null;
  acepta_remoto?: boolean;
  acepta_hibrido?: boolean;
  acepta_presencial?: boolean;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  estado_id?: number | null;
  selector_id?: number | null;
  guardado_en_pool?: boolean;
  cv_path?: string | null;
};

function Campo({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

export async function PostulanteForm({ postulante }: { postulante?: Postulante }) {
  const supabase = await createClient();

  const [{ data: estados }, { data: selectores }, cvUrl] = await Promise.all([
    supabase.from("estados_postulante").select("id, nombre").order("orden"),
    supabase.from("selectores").select("id, nombre, apellido").eq("estado", "activo").order("nombre"),
    postulante?.cv_path ? urlFirmadaCv(postulante.cv_path) : Promise.resolve(null),
  ]);

  return (
    <form action={guardarPostulante} className="space-y-8">
      {postulante?.id && <input type="hidden" name="id" value={postulante.id} />}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Datos personales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nombre" name="nombre" defaultValue={postulante?.nombre} required />
          <Campo label="Apellido" name="apellido" defaultValue={postulante?.apellido} required />
          <Campo label="Email" name="email" type="email" defaultValue={postulante?.email} required />
          <Campo label="Teléfono" name="telefono" defaultValue={postulante?.telefono} />
          <Campo
            label="Fecha de nacimiento"
            name="fecha_nacimiento"
            type="date"
            defaultValue={postulante?.fecha_nacimiento}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Género</span>
            <select
              name="genero"
              defaultValue={postulante?.genero ?? ""}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Sin especificar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiere_no_decir">Prefiere no decir</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Ubicación
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="País" name="pais" defaultValue={postulante?.pais ?? "Argentina"} />
          <Campo label="Provincia" name="provincia" defaultValue={postulante?.provincia} />
          <Campo label="Ciudad" name="ciudad" defaultValue={postulante?.ciudad} />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="disponibilidad_mudanza"
            defaultChecked={postulante?.disponibilidad_mudanza ?? false}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="font-medium text-slate-700">Disponibilidad para mudanza</span>
        </label>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Perfil profesional
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Título principal" name="titulo_principal" defaultValue={postulante?.titulo_principal} />
          <Campo
            label="Experiencia (años)"
            name="experiencia_anos"
            type="number"
            defaultValue={postulante?.experiencia_anos ?? 0}
          />
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Resumen profesional</span>
              <textarea
                name="resumen_profesional"
                defaultValue={postulante?.resumen_profesional}
                rows={3}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
          <Campo label="Habilidades" name="habilidades" defaultValue={postulante?.habilidades} />
          <Campo label="Idiomas" name="idiomas" defaultValue={postulante?.idiomas} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Pretensiones y preferencias
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            label="Salario pretendido mínimo"
            name="salario_pretendido_minimo"
            type="number"
            defaultValue={postulante?.salario_pretendido_minimo}
          />
          <Campo
            label="Salario pretendido máximo"
            name="salario_pretendido_maximo"
            type="number"
            defaultValue={postulante?.salario_pretendido_maximo}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="acepta_remoto"
              defaultChecked={postulante?.acepta_remoto ?? true}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-700">Acepta remoto</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="acepta_hibrido"
              defaultChecked={postulante?.acepta_hibrido ?? true}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-700">Acepta híbrido</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="acepta_presencial"
              defaultChecked={postulante?.acepta_presencial ?? true}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-700">Acepta presencial</span>
          </label>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          CV y enlaces
        </h2>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              {postulante?.cv_path ? "Reemplazar CV" : "CV (PDF o Word)"}
            </span>
            <input
              type="file"
              name="cv"
              accept=".pdf,.doc,.docx"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
            />
          </label>
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              📄 Ver CV actual
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="LinkedIn" name="linkedin_url" defaultValue={postulante?.linkedin_url} />
          <Campo label="Portfolio" name="portfolio_url" defaultValue={postulante?.portfolio_url} />
          <Campo label="GitHub" name="github_url" defaultValue={postulante?.github_url} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Gestión
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Estado</span>
            <select
              name="estado_id"
              defaultValue={postulante?.estado_id ?? ""}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Sin estado</option>
              {(estados ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Selector responsable</span>
            <select
              name="selector_id"
              defaultValue={postulante?.selector_id ?? ""}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Sin asignar</option>
              {(selectores ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {`${s.nombre ?? ""} ${s.apellido ?? ""}`.trim() || `Selector #${s.id}`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="guardado_en_pool"
            defaultChecked={postulante?.guardado_en_pool ?? true}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="font-medium text-slate-700">Guardado en pool de talento</span>
        </label>
      </section>

      <div className="flex gap-3 border-t border-slate-100 pt-6">
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Guardar postulante
        </button>
        <a
          href="/admin/postulantes"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
