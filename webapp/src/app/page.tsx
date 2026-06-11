import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { esStaff } from "@/lib/types";

export default async function Home() {
  // Pantalla de ayuda si todavía no se configuró Supabase
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-xl font-bold text-amber-900">
            ⚙️ Falta configurar Supabase
          </h1>
          <p className="mt-3 text-amber-800">
            Creá el archivo <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-sm">.env.local</code>{" "}
            en la carpeta <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-sm">webapp/</code>{" "}
            con tus credenciales de Supabase. Seguí los pasos de{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-sm">README-SETUP.md</code>.
          </p>
        </div>
      </main>
    );
  }

  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  if (esStaff(profile.rol)) {
    redirect("/admin");
  }

  redirect("/portal");
}
