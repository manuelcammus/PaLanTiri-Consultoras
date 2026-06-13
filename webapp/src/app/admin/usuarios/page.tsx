import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ROL_LABELS, esSuperAdmin, type Rol } from "@/lib/types";
import { actualizarUsuario, eliminarUsuario, crearUsuario } from "./actions";

// Opciones de rol que ve cada quién en los desplegables.
const ROLES_SUPER: Rol[] = ["super_admin", "admin", "consultora", "selector"];
const ROLES_ADMIN: Rol[] = ["consultora", "selector"];

export default async function UsuariosPage() {
  const supabase = await createClient();
  const perfil = await getProfile();
  const puedeGestionarTodo = esSuperAdmin(perfil?.rol);
  const rolesAsignables = puedeGestionarTodo ? ROLES_SUPER : ROLES_ADMIN;

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, email, nombre, apellido, telefono, rol, activo")
    .order("created_at", { ascending: false });

  // Un admin no puede tocar cuentas admin/super_admin: son del super_admin.
  const esCuentaProtegida = (rol: Rol) =>
    !puedeGestionarTodo && (rol === "super_admin" || rol === "admin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="mt-1 text-slate-500">
          Administración de cuentas y roles de acceso.
          {!puedeGestionarTodo && (
            <span className="mt-1 block text-xs text-slate-400">
              Podés dar de alta y administrar usuarios de la consultora y selectores. Los roles de
              Administrador y Super Administrador los gestiona Palantiri.
            </span>
          )}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Crear nuevo usuario
        </h2>
        <form action={crearUsuario} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              name="nombre"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Apellido</span>
            <input
              type="text"
              name="apellido"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              name="email"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Contraseña inicial</span>
            <input
              type="text"
              name="password"
              required
              minLength={6}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Rol</span>
            <select
              name="rol"
              defaultValue="selector"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {rolesAsignables.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Crear usuario
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          Si el rol es &quot;Selector&quot;, se vincula automáticamente con un registro de la tabla de
          selectores que tenga el mismo email.
        </p>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Teléfono</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Rol</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(usuarios ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {u.nombre} {u.apellido}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.telefono}</td>
                <td className="px-4 py-3">
                  {esCuentaProtegida(u.rol as Rol) ? (
                    <span className="text-xs font-medium text-slate-500">
                      {ROL_LABELS[u.rol as Rol]}
                    </span>
                  ) : (
                    <details>
                      <summary className="cursor-pointer text-xs font-medium text-indigo-600">
                        {ROL_LABELS[u.rol as Rol]}
                      </summary>
                      <form action={actualizarUsuario} className="mt-3 flex flex-col gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="nombre" value={u.nombre} />
                        <input type="hidden" name="apellido" value={u.apellido} />
                        <input type="hidden" name="telefono" value={u.telefono ?? ""} />
                        <select
                          name="rol"
                          defaultValue={u.rol}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          {rolesAsignables.map((r) => (
                            <option key={r} value={r}>
                              {ROL_LABELS[r]}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            name="activo"
                            defaultChecked={u.activo}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Activo
                        </label>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Guardar
                        </button>
                      </form>
                    </details>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {!esCuentaProtegida(u.rol as Rol) && (
                    <form action={eliminarUsuario}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Eliminar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(usuarios ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Todavía no hay usuarios cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
