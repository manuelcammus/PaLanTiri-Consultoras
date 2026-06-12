import { getSelectorActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cargarPostulante } from "./actions";

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
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

export default async function CargarPostulantePage({
  searchParams,
}: {
  searchParams: Promise<{ busqueda?: string }>;
}) {
  const { busqueda } = await searchParams;
  const selector = await getSelectorActual();

  if (!selector) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Tu usuario todavía no está vinculado a un selector.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: asignaciones } = await supabase
    .from("asignaciones_busqueda")
    .select("perfiles_busqueda(id, titulo_puesto, empresas(nombre))")
    .eq("selector_id", selector.id)
    .eq("estado", "aceptada");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Cargar postulante</h1>
      <p className="mt-1 text-slate-500">Sumá un candidato directo a una de tus búsquedas asignadas.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={cargarPostulante} className="space-y-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Búsqueda</span>
            <select
              name="perfil_busqueda_id"
              defaultValue={busqueda ?? ""}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="" disabled>
                Seleccionar búsqueda
              </option>
              {(asignaciones ?? []).map((a) => {
                const perfil = a.perfiles_busqueda as unknown as {
                  id: number;
                  titulo_puesto: string;
                  empresas: { nombre: string } | null;
                } | null;
                if (!perfil) return null;
                return (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.titulo_puesto} — {perfil.empresas?.nombre}
                  </option>
                );
              })}
            </select>
          </label>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Datos del candidato
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Nombre" name="nombre" required />
              <Campo label="Apellido" name="apellido" required />
              <Campo label="Email" name="email" type="email" required />
              <Campo label="Teléfono" name="telefono" />
              <Campo label="Ciudad" name="ciudad" />
              <Campo label="Título principal" name="titulo_principal" />
              <Campo label="Experiencia (años)" name="experiencia_anos" type="number" />
              <Campo label="LinkedIn" name="linkedin_url" />
              <Campo label="Salario pretendido mínimo" name="salario_pretendido_minimo" type="number" />
              <Campo label="Salario pretendido máximo" name="salario_pretendido_maximo" type="number" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Resumen profesional</span>
                <textarea
                  name="resumen_profesional"
                  rows={3}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <Campo label="Habilidades" name="habilidades" />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">CV (PDF o Word, máx. 10 MB)</span>
                <input
                  type="file"
                  name="cv"
                  accept=".pdf,.doc,.docx"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Cargar postulante
          </button>
        </form>
      </div>
    </div>
  );
}
