import { guardarSelector } from "./actions";

type Selector = {
  id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  especializacion?: string;
  experiencia_anos?: number;
  descripcion_perfil?: string;
  pais?: string;
  provincia?: string;
  ciudad?: string;
  estado?: string;
  cuit?: string;
  dni?: string | null;
  banco?: string;
  numero_cuenta?: string;
  cbu?: string;
  alias_cvu?: string;
  comision_porcentaje_defecto?: number;
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

export function SelectorForm({ selector }: { selector?: Selector }) {
  return (
    <form action={guardarSelector} className="space-y-8">
      {selector?.id && <input type="hidden" name="id" value={selector.id} />}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Datos personales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nombre" name="nombre" defaultValue={selector?.nombre} required />
          <Campo label="Apellido" name="apellido" defaultValue={selector?.apellido} required />
          <Campo label="Email" name="email" type="email" defaultValue={selector?.email} required />
          <Campo label="Teléfono" name="telefono" defaultValue={selector?.telefono} />
          <Campo label="DNI" name="dni" defaultValue={selector?.dni} />
          <Campo label="CUIT" name="cuit" defaultValue={selector?.cuit} required />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Perfil profesional
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Especialización</span>
            <select
              name="especializacion"
              defaultValue={selector?.especializacion ?? "general"}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="it">IT</option>
              <option value="admin">Administración</option>
              <option value="ejecutivo">Ejecutivo</option>
              <option value="general">General</option>
            </select>
          </label>
          <Campo
            label="Experiencia (años)"
            name="experiencia_anos"
            type="number"
            defaultValue={selector?.experiencia_anos ?? 0}
          />
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Descripción de perfil</span>
              <textarea
                name="descripcion_perfil"
                defaultValue={selector?.descripcion_perfil}
                rows={3}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Ubicación
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="País" name="pais" defaultValue={selector?.pais ?? "Argentina"} />
          <Campo label="Provincia" name="provincia" defaultValue={selector?.provincia} />
          <Campo label="Ciudad" name="ciudad" defaultValue={selector?.ciudad} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Datos bancarios y comisión
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Banco" name="banco" defaultValue={selector?.banco} />
          <Campo label="Número de cuenta" name="numero_cuenta" defaultValue={selector?.numero_cuenta} />
          <Campo label="CBU" name="cbu" defaultValue={selector?.cbu} />
          <Campo label="Alias CVU" name="alias_cvu" defaultValue={selector?.alias_cvu} />
          <Campo
            label="Comisión por defecto (%)"
            name="comision_porcentaje_defecto"
            type="number"
            defaultValue={selector?.comision_porcentaje_defecto ?? 50}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Estado</span>
            <select
              name="estado"
              defaultValue={selector?.estado ?? "activo"}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="pausado">Pausado</option>
              <option value="baja">Baja</option>
            </select>
          </label>
        </div>
      </section>

      <div className="flex gap-3 border-t border-slate-100 pt-6">
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Guardar selector
        </button>
        <a
          href="/admin/selectores"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
