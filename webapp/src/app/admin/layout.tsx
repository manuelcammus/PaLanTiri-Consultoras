import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getConsultora } from "@/lib/consultora";
import { esStaff, ROL_LABELS } from "@/lib/types";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { cerrarSesion } from "@/app/auth/actions";

const NAV_STAFF: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/kpis", label: "KPIs", icon: "📈" },
  { href: "/admin/empresas", label: "Empresas", icon: "🏢" },
  { href: "/admin/busquedas", label: "Búsquedas", icon: "🔍" },
  { href: "/admin/selectores", label: "Selectores", icon: "🧑‍💼" },
  { href: "/admin/postulantes", label: "Postulantes", icon: "👥" },
  { href: "/admin/talentos", label: "Base de talentos", icon: "💎" },
  { href: "/admin/kanban", label: "Tablero Kanban", icon: "📋" },
  { href: "/admin/entrevistas", label: "Entrevistas", icon: "🗓️" },
  { href: "/admin/comisiones", label: "Comisiones", icon: "💰" },
  { href: "/admin/garantias", label: "Garantías", icon: "🛡️" },
];

const NAV_ADMIN: NavItem[] = [
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

const NAV_SUPER: NavItem[] = [
  { href: "/admin/usuarios", label: "Usuarios", icon: "🔐" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (!esStaff(profile.rol)) redirect("/portal");

  const consultora = await getConsultora();

  const items = [
    ...NAV_STAFF,
    ...(profile.rol === "super_admin" || profile.rol === "admin"
      ? NAV_ADMIN
      : []),
    ...(profile.rol === "super_admin" ? NAV_SUPER : []),
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={consultora.logoUrl} alt={consultora.nombre} className="h-10 w-10 object-contain" />
          </div>
          <div>
            <p className="font-bold leading-tight text-slate-900">{consultora.nombre}</p>
            <p className="text-xs text-slate-500">Panel de gestión</p>
          </div>
        </div>

        <SidebarNav items={items} />

        <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="truncate px-2 text-sm font-medium text-slate-900">
            {profile.nombre || profile.email}
          </p>
          <p className="px-2 text-xs text-slate-500">
            {ROL_LABELS[profile.rol]}
          </p>
          <form action={cerrarSesion} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Cerrar sesión
            </button>
          </form>
          {/* Marca del producto: no configurable */}
          <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3">
            <Image src="/logo-palantiri-icon.png" alt="Palantiri" width={14} height={14} className="object-contain opacity-60" />
            <p className="text-[10px] text-slate-400">Un producto de Palantiri Consultoras</p>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-x-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
