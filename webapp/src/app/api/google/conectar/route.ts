import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { esStaff } from "@/lib/types";
import { googleConfigurado, urlAutorizacion } from "@/lib/google/oauth";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile || !esStaff(profile.rol)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!googleConfigurado()) {
    return NextResponse.redirect(new URL("/admin/configuracion?google=sin_config", request.url));
  }
  return NextResponse.redirect(urlAutorizacion());
}
