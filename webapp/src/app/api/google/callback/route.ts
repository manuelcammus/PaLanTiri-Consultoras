import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { esStaff } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { intercambiarCodigo } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const profile = await getProfile();
  if (!profile || !esStaff(profile.rol)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/admin/configuracion?google=error", request.url));
  }

  try {
    const token = await intercambiarCodigo(code);
    const admin = createAdminClient();
    const { error } = await admin
      .from("google_tokens")
      .upsert({ profile_id: profile.id, token }, { onConflict: "profile_id" });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("Google callback falló:", e);
    return NextResponse.redirect(new URL("/admin/configuracion?google=error", request.url));
  }

  return NextResponse.redirect(new URL("/admin/configuracion?google=conectado", request.url));
}
