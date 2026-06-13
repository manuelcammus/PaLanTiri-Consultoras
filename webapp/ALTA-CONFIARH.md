# Alta de ConfiaRH (instancia de prueba)

Configuración elegida:
- **Dominio:** subdominio gratis `*.vercel.app` (sin DNS, sin comprar dominio)
- **Emails:** Resend en modo prueba (solo llegan a tu casilla de Resend)
- **Admin:** cuenta de prueba primero (tu email), después se entrega a ConfiaRH

> Ojo con el orden: como el dominio es `.vercel.app`, recién sabés la URL
> final **después** de desplegar en Vercel. Por eso hacemos: Supabase →
> Vercel (deploy) → anotar la URL → completar Turnstile/Google/SITE_URL →
> redeploy.

---

## Paso 1 — Supabase (base de ConfiaRH)

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
   - Name: `consultora-confiarh`
   - Region: **South America (São Paulo)**
   - Database Password: poné una fuerte y **guardala**.
2. Esperá ~2 min a que termine de crear.
3. **SQL Editor → New query** → pegá TODO el contenido de
   `webapp/supabase/MIGRACIONES-BUNDLE.sql` → **RUN**.
   - ✔️ "Success". (Trae las 8 migraciones 0001–0008 de una.)
4. **Settings → API** → copiá y guardá:
   - `Project URL` → `https://xxxxx.supabase.co`
   - `anon` `public` key
   - `service_role` `secret` key
5. **Crear el admin de prueba: Authentication → Users → Add user → Create new user**
   - Email: **(tu email)**
   - Password: una temporal
   - ✅ **Auto Confirm User**
   - Create user.
6. **SQL Editor** → subir ese usuario a admin:
   ```sql
   update public.profiles set rol = 'admin' where email = 'TU_EMAIL_ACA';
   ```
   - ✔️ Affected rows: 1
7. **CAPTCHA — Authentication → Attack Protection:**
   - Enable Captcha protection: **ON**
   - Provider: **Turnstile**
   - Secret: el **Secret Key** de Cloudflare (lo sacás en el Paso 4) → **Save**
   - ⚠️ Dejá este paso a medias hasta tener el Secret Key del Paso 4.

## Paso 2 — Vercel (deploy)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importar
   `PaLanTiri-Consultoras`.
   - **Root Directory: `webapp`** (¡importante!)
   - Framework: Next.js (lo detecta solo)
2. **Environment Variables** — cargá estas (las de dominio/captcha se completan
   después del primer deploy):

   ```
   NEXT_PUBLIC_SUPABASE_URL=(Project URL del paso 1.4)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=(anon key del paso 1.4)
   SUPABASE_SERVICE_ROLE_KEY=(service_role key del paso 1.4)
   RESEND_API_KEY=(API key de Resend — paso 3)
   EMAIL_FROM=ConfiaRH <onboarding@resend.dev>
   GOOGLE_CLIENT_ID=(el de Palantiri)
   GOOGLE_CLIENT_SECRET=(el de Palantiri)
   ```
   (todavía NO pongas `NEXT_PUBLIC_SITE_URL` ni `NEXT_PUBLIC_TURNSTILE_SITE_KEY`)
3. **Deploy**. Cuando termine, Vercel te da la URL, ej.
   `https://palantiri-consultoras-xxxx.vercel.app`. **Anotala** → es la URL de ConfiaRH.
   - (Opcional) Settings → Domains → podés renombrar el subdominio a algo como
     `confiarh.vercel.app` si está libre.

## Paso 3 — Resend (modo prueba)

1. En tu cuenta de [resend.com](https://resend.com) → **API Keys → Create API Key**.
2. Copiala → va en Vercel como `RESEND_API_KEY`.
3. No hace falta verificar dominio: en modo prueba los emails solo llegan a la
   casilla con la que te registraste en Resend (suficiente para demo).

## Paso 4 — Cloudflare Turnstile (captcha)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile**.
2. Si ya tenés el widget `Palantiri`: **Settings → Hostnames → agregá** el
   dominio de ConfiaRH (la URL `.vercel.app` del paso 2.3). Si no, **Add widget**,
   name `Palantiri`, hostname ese dominio.
3. Copiá **Site Key** y **Secret Key** (las mismas para todas las consultoras).
4. Pegá:
   - **Site Key** → Vercel `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - **Secret Key** → Supabase (Paso 1.7)

## Paso 5 — Completar y redeploy

1. En Vercel → Settings → Environment Variables, agregá ahora:
   ```
   NEXT_PUBLIC_SITE_URL=(la URL .vercel.app del paso 2.3)
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=(Site Key del paso 4)
   ```
2. **Deployments → … → Redeploy** (para que tome las nuevas variables).

## Paso 6 — Google Calendar/Meet (opcional, para después)

1. Google Cloud de Palantiri → APIs y servicios → Credenciales → cliente OAuth
   `palantiri-webapp` → **+ Agregar URI de redireccionamiento**:
   `https://(URL .vercel.app)/api/google/callback`
2. Dentro de la app: Configuración → Integración con Google → Conectar.

## Paso 7 — Configuración dentro de la app

1. Entrá a la URL `.vercel.app` con tu email admin + clave temporal.
2. **Configuración → Identidad de la consultora:** nombre `ConfiaRH`, logo,
   teléfono, email, web.
3. Revisá **Alertas automáticas**.

## Paso 8 — Registrar en tu Consola Palantiri

En tu instancia → **Consola Palantiri → Registrar consultora**:
- Nombre: `ConfiaRH`
- URL: la `.vercel.app` de ConfiaRH

## Verificación final

- [ ] `https://(URL)/api/health` responde `"status": "ok"`
- [ ] El login muestra el captcha y entrás con tu admin
- [ ] Configuración muestra el nombre/logo de ConfiaRH
- [ ] (Cuando pase a real) cambiar el admin al email de ConfiaRH
- [ ] ConfiaRH figura "En línea" en la Consola Palantiri
