# Alta de una nueva consultora (instancia)

Checklist para desplegar la plataforma para un cliente nuevo de Palantiri.
Tiempo estimado: **30–45 minutos**. Modelo: 1 repo → N instancias (cada
consultora tiene su propio Supabase, su proyecto Vercel y su dominio; todas
se actualizan automáticamente con cada push a `main`).

---

## 1. Supabase (base de datos propia del cliente)

1. En [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
   - Nombre: `consultora-<cliente>` · Región: South America (São Paulo) · Guardar la contraseña de la DB.
2. **SQL Editor** → ejecutar **en orden** cada archivo de `webapp/supabase/migrations/`:
   `0001_schema.sql` → `0002_rls.sql` → `0003_seed.sql` → `0004_storage.sql` → `0005_email_queue.sql` → `0006_configuracion_consultora.sql` → `0007_instancias_consultoras.sql` → `0008_admin_gestiona_usuarios.sql`
3. **Settings → API**: copiar `Project URL`, `anon` key y `service_role` key (se usan en el paso 2).
4. Crear el usuario **admin del cliente** (es `admin`, NO `super_admin` — el super_admin es Palantiri):
   **Authentication → Users → Add user → Create new user** (email + contraseña temporal,
   marcar *Auto Confirm User*). El UUID no hace falta copiarlo. Luego en SQL Editor:
   ```sql
   update public.profiles set rol = 'admin' where email = 'admin@cliente.com';
   ```
5. (Captcha — **paso obligatorio**) **Authentication → Attack protection → Enable CAPTCHA**:
   proveedor Turnstile + el *secret key* del paso 4 de Cloudflare. Las **3 piezas** del CAPTCHA
   tienen que estar puestas o nadie puede entrar: (1) secret key acá en Supabase, (2)
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en Vercel, (3) el dominio del cliente agregado al widget de Cloudflare.

## 2. Vercel (la web del cliente)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importar el repo
   `PaLanTiri-Consultoras` (el mismo de siempre).
   - **Root Directory: `webapp`** · Framework: Next.js.
2. **Environment Variables** (Production + Preview + Development):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL del paso 1.3 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key del paso 1.3 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key del paso 1.3 |
   | `NEXT_PUBLIC_SITE_URL` | `https://dominio-del-cliente.com` |
   | `RESEND_API_KEY` | API key de Resend del cliente (paso 3) |
   | `EMAIL_FROM` | `Consultora X <noreply@dominio-del-cliente.com>` |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | site key de Turnstile (paso 4) |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | los de Palantiri (paso 5) |

3. **Deploy**. Luego **Settings → Domains** → agregar el dominio del cliente y
   seguir las instrucciones de DNS (CNAME → `cname.vercel-dns.com`).

## 3. Resend (emails del cliente)

1. Crear cuenta en [resend.com](https://resend.com) (puede ser del cliente).
2. **Domains → Add Domain** con el dominio del cliente → cargar los registros
   DNS (SPF/DKIM) → Verify.
3. **API Keys → Create** → va a `RESEND_API_KEY` en Vercel.

## 4. Cloudflare Turnstile (captcha del login)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile → Add widget**.
2. Hostname: el dominio del cliente. Copiar **site key** (→ Vercel) y
   **secret key** (→ Supabase, paso 1.5).

## 5. Google Calendar/Meet

1. En el proyecto de Google Cloud de Palantiri → **APIs y servicios →
   Credenciales** → cliente OAuth `palantiri-webapp` → **+ Agregar URI**:
   `https://dominio-del-cliente.com/api/google/callback`
2. El cliente conecta SU cuenta de Google desde **Configuración → Integración
   con Google** dentro de su app.

## 6. WhatsApp (worker local del cliente)

1. Copiar la carpeta `worker/` a la PC del cliente (necesita Python y Chrome).
2. Crear `worker/.env` con el Supabase **del cliente**:
   ```
   SUPABASE_URL=https://<proyecto-del-cliente>.supabase.co
   SUPABASE_SERVICE_KEY=<service_role key del cliente>
   ```
3. `pip install -r requirements.txt` y `python whatsapp_worker_supabase.py` →
   escanear el QR con el número de WhatsApp de la consultora.

## 7. Configuración inicial dentro de la app

1. Entrar con el usuario admin → **Configuración → Identidad de la
   consultora**: nombre, logo, teléfono, email, web.
2. Revisar plantillas de **Alertas automáticas**.
3. Conectar **Google** (paso 5.2).
4. Crear usuarios del equipo en **Usuarios** y cargar los primeros selectores.

## 8. Registrar en la consola madre

En **tu** instancia de Palantiri → **Consola Palantiri** → Registrar
consultora (nombre + `https://dominio-del-cliente.com`). Desde ahí monitoreás
estado, versión y servicios de la instancia.

## Verificación final

- [ ] `https://dominio-del-cliente.com/api/health` responde `"status": "ok"`
- [ ] Login con captcha funciona y muestra el logo del cliente
- [ ] Crear un selector → llega el email de invitación
- [ ] Asignar una búsqueda → email + WhatsApp al selector
- [ ] Agendar entrevista con Meet → evento en el Calendar del cliente
- [ ] La instancia aparece "En línea" en la Consola Palantiri
