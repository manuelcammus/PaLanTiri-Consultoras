import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getConsultora } from "@/lib/consultora";
import { esStaff, ROL_LABELS } from "@/lib/types";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { cerrarSesion } from "@/app/auth/actions";

const NAV_SELECTOR: NavItem[] = [
  { href: "/portal", label: "Inicio", icon: "🏠" },
  { href: "/portal/busquedas", label: "Mis Búsquedas", icon: "🔍" },
  { href: "/portal/cargar", label: "Cargar Postulante", icon: "➕" },
  { href: "/portal/postulantes", label: "Mis Postulantes", icon: "👥" },
  { href: "/portal/comisiones", label: "Mis Comisiones", icon: "💰" },
  { href: "/portal/garantias", label: "Garantías", icon: "🛡️" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (esStaff(profile.rol)) redirect("/admin");

  const consultora = await getConsultora();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={consultora.logoUrl} alt={consultora.nombre} className="h-10 w-10 object-contain" />
          </div>
          <div>
            <p className="font-bold leading-tight text-slate-900">
              Portal Selector
            </p>
            <p className="text-xs text-slate-500">{consultora.nombre}</p>
          </div>
        </div>

        <SidebarNav items={NAV_SELECTOR} />

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

      <main className="flex-1 overflow-x-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
