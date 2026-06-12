import { createAdminClient } from "@/lib/supabase/admin";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

type TokenGuardado = {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
  scope?: string;
};

export function googleConfigurado(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && SITE_URL);
}

export function redirectUri(): string {
  return `${SITE_URL}/api/google/callback`;
}

// URL de consentimiento de Google. access_type=offline + prompt=consent
// garantizan recibir un refresh_token para operar sin usuario presente.
export function urlAutorizacion(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function intercambiarCodigo(code: string): Promise<TokenGuardado> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`);

  const json = await res.json();
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in ?? 3600) * 1000,
    scope: json.scope,
  };
}

// ¿Hay alguna cuenta de Google conectada? (la usa la UI para mostrar estado)
export async function googleConectado(): Promise<boolean> {
  if (!googleConfigurado()) return false;
  const admin = createAdminClient();
  const { count } = await admin
    .from("google_tokens")
    .select("*", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

// Devuelve un access_token vigente de la cuenta conectada (refrescándolo si
// venció) o null si no hay cuenta conectada.
export async function getAccessToken(): Promise<string | null> {
  if (!googleConfigurado()) return null;

  const admin = createAdminClient();
  const { data: fila } = await admin
    .from("google_tokens")
    .select("id, token")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!fila) return null;

  const token = fila.token as TokenGuardado;

  if (token.expires_at > Date.now() + 60_000) {
    return token.access_token;
  }

  if (!token.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error(`Google refresh error ${res.status}: ${await res.text()}`);
    return null;
  }

  const json = await res.json();
  const actualizado: TokenGuardado = {
    ...token,
    access_token: json.access_token,
    expires_at: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  await admin.from("google_tokens").update({ token: actualizado }).eq("id", fila.id);

  return actualizado.access_token;
}

// Revoca el token en Google y borra la conexión local.
export async function desconectarGoogle(): Promise<void> {
  const admin = createAdminClient();
  const { data: filas } = await admin.from("google_tokens").select("id, token");

  for (const fila of filas ?? []) {
    const token = fila.token as TokenGuardado;
    const valor = token.refresh_token ?? token.access_token;
    if (valor) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(valor)}`, {
        method: "POST",
      }).catch(() => {});
    }
  }

  await admin.from("google_tokens").delete().gte("id", 0);
}
