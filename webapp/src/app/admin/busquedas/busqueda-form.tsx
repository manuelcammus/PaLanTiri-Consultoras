import { createClient } from "@/lib/supabase/server";
import { guardarBusqueda } from "./actions";

type Busqueda = {
  id?: number;
  empresa_id?: number;
  titulo_puesto?: string;
  descripcion?: string;
  areas?: string;
  nivel?: string;
  experiencia_minima_anios?: number;
  es_remoto?: boolean;
  ubicacion_puesto?: string;
  salario_minimo?: number;
  salario_maximo?: number;
  cantidad_posiciones?: number;
  estado_id?: number | null;
  selector_asignado_id?: number | null;
  prioridad?: string;
  fecha_vencimiento?: string | null;
  notas_internas?: string;
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

export async function BusquedaForm({ busqueda }: { busqueda?: Busqueda }) {
  const supabase = await createClient();

  const [{ data: empresas }, { data: estados }, { data: selectores }] = await Promise.all([
    supabase.from("empresas").select("id, nombre").eq("activa", true).order("nombre"),
    supabase.from("estados_busqueda").select("id, nombre").order("orden"),
    supabase
      .from("selectores")
      .select("id, nombre, apellido")
      .eq("estado", "activo")
      .order("nombre"),
  ]);

  return (
    <form action={guardarBusqueda} className="space-y-8">
      {busqueda?.id && <input type="hidden" name="id" value={busqueda.id} />}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Datos generales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Empresa</span>
            <select
              name="empresa_id"
              defaultValue={busqueda?.empresa_id ?? ""}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="" disabled>
                Seleccionar empresa
              </option>
              {(empresas ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
          <Campo label="Título del puesto" name="titulo_puesto" defaultValue={busqueda?.titulo_puesto} required />

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Área</span>
            <select
              name="areas"
              defaultValue={busqueda?.areas ?? "otro"}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="it">IT</option>
              <option value="admin">Administración</option>
              <option value="ejecutivo">Ejecutivo</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Nivel</span>
            <select
              name="nivel"
              defaultValue={busqueda?.nivel ?? "semi_senior"}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="senior">Senior</option>
              <option value="semi_senior">Semi Senior</option>
              <option value="junior">Junior</option>
              <option value="practicante">Practicante</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Descripción</span>
              <textarea
                name="descripcion"
                defaultValue={busqueda?.descripcion}
                rows={3}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Condiciones
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo
            label="Experiencia mínima (años)"
            name="experiencia_minima_anios"
            type="number"
            defaultValue={busqueda?.experiencia_minima_anios ?? 0}
          />
          <Campo label="Ubicación del puesto" name="ubicacion_puesto" defaultValue={busqueda?.ubicacion_puesto} />
          <Campo
            label="Cantidad de posiciones"
            name="cantidad_posiciones"
            type="number"
            defaultValue={busqueda?.cantidad_posiciones ?? 1}
          />
          <Campo label="Salario mínimo" name="salario_minimo" type="number" defaultValue={busqueda?.salario_minimo ?? 0} />
          <Campo label="Salario máximo" name="salario_maximo" type="number" defaultValue={busqueda?.salario_maximo ?? 0} />
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              name="es_remoto"
              defaultChecked={busqueda?.es_remoto ?? false}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium text-slate-700">Modalidad remota</span>
          </label>
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
              defaultValue={busqueda?.estado_id ?? ""}
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
            <span className="font-medium text-slate-700">Selector asignado</span>
            <select
              name="selector_asignado_id"
              defaultValue={busqueda?.selector_asignado_id ?? ""}
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

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Prioridad</span>
            <select
              name="prioridad"
              defaultValue={busqueda?.prioridad ?? "normal"}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>

          <Campo
            label="Fecha de vencimiento"
            name="fecha_vencimiento"
            type="date"
            defaultValue={busqueda?.fecha_vencimiento}
          />

          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Notas internas</span>
              <textarea
                name="notas_internas"
                defaultValue={busqueda?.notas_internas}
                rows={3}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="flex gap-3 border-t border-slate-100 pt-6">
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Guardar búsqueda
        </button>
        <a
          href="/admin/busquedas"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
