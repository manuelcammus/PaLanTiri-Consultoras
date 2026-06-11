# 🚀 Guía de Puesta en Marcha — ATS Consultora (Next.js + Supabase + Vercel)

Esta guía te lleva de cero a la aplicación funcionando, paso a paso.

---

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta (gratis).
2. Click en **New Project**:
   - **Name:** `ats-consultora` (o el que quieras)
   - **Database Password:** generá una fuerte y **guardala**
   - **Region:** South America (São Paulo) — la más cercana a Argentina
3. Esperá ~2 minutos a que el proyecto se aprovisione.

## 2. Ejecutar las migraciones SQL

En el dashboard de Supabase → **SQL Editor** → **New query**, ejecutá **en orden** el contenido de cada archivo de la carpeta `supabase/migrations/`:

| Orden | Archivo | Qué hace |
|-------|---------|----------|
| 1º | `0001_schema.sql` | Crea las 40+ tablas, tipos y triggers (comisión automática, códigos, historial) |
| 2º | `0002_rls.sql` | Activa la seguridad por roles (RLS) en todas las tablas |
| 3º | `0003_seed.sql` | Carga estados, niveles de estudio, tipos de empleo y alertas base |
| 4º | `0004_storage.sql` | Crea los buckets de archivos (CVs privados, flyers públicos) |

> 💡 Abrí cada archivo, copiá todo el contenido, pegalo en el editor y dale **Run**. Si un paso da error, no sigas con el siguiente: avisame y lo corregimos.

## 3. Desactivar el registro público

Para que **solo el administrador** pueda crear usuarios:

1. Dashboard → **Authentication** → **Sign In / Up**
2. Desactivá **"Allow new users to sign up"**

## 4. Crear tu usuario Super Administrador

1. Dashboard → **Authentication** → **Users** → **Add user** → **Create new user**
   - Email y contraseña tuyos
   - ✅ Marcá **Auto Confirm User**
2. El sistema le creó automáticamente un perfil con rol `selector`. Subilo a super admin: andá a **SQL Editor** y ejecutá (con tu email):

```sql
update public.profiles set rol = 'super_admin' where email = 'tu@email.com';
```

## 5. Configurar la webapp en local

1. En el dashboard → **Settings** → **API Keys**, copiá:
   - **Project URL**
   - **anon public** key
   - **service_role** key (¡secreta!)
2. En la carpeta `webapp/`, copiá `.env.local.example` como `.env.local` y completá los tres valores.
3. Levantá el servidor de desarrollo:

```bash
cd webapp
npm run dev
```

4. Abrí [http://localhost:3000](http://localhost:3000) e ingresá con tu usuario. Deberías ver el **panel de administración**.

## 6. Crear los demás usuarios

Por ahora se crean desde el dashboard de Supabase (Authentication → Add user) y se les asigna rol por SQL:

```sql
-- Roles posibles: 'super_admin', 'admin', 'consultora', 'selector'
update public.profiles set rol = 'admin' where email = 'admin@consultora.com';
```

Para un **selector**, además hay que vincular su usuario con su ficha de selector:

```sql
-- 1. Crear la ficha del selector (o si ya existe, saltar al paso 2)
insert into public.selectores (nombre, apellido, email, telefono, cuit, provincia, ciudad)
values ('Juan', 'Pérez', 'juan@email.com', '+5493764000000', '20-12345678-9', 'Misiones', 'Posadas');

-- 2. Vincular la ficha con su usuario de login
update public.selectores
set profile_id = (select id from public.profiles where email = 'juan@email.com')
where email = 'juan@email.com';
```

> 🔜 Próximamente la pantalla **Usuarios** del panel hará todo esto con un click.

## 7. Deploy a Vercel

1. Subí la carpeta `webapp/` a un repositorio de GitHub.
2. Entrá a [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. En **Environment Variables**, cargá las mismas tres variables del `.env.local`.
4. **Deploy**. En ~2 minutos tenés la app online con HTTPS.

> Cada `git push` a la rama principal redeploya automáticamente.

## 8. Worker de WhatsApp (opcional, corre en tu PC)

```bash
cd worker
pip install -r requirements.txt
```

Creá un archivo `worker/.env` con:

```
SUPABASE_URL=https://TUPROYECTO.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   (la service_role key)
```

Y ejecutalo:

```bash
python whatsapp_worker_supabase.py
```

La primera vez escaneá el QR de WhatsApp Web. El worker queda esperando: cuando la webapp encola un mensaje en la tabla `whatsapp_messages`, lo envía automáticamente.

---

## Arquitectura de roles

| Rol | Accede a | Puede |
|-----|----------|-------|
| `super_admin` | Panel completo | Todo + gestionar usuarios y roles |
| `admin` | Panel completo | Operación + configuración (estados, alertas) |
| `consultora` | Panel operativo | Gestión diaria (sin configuración) |
| `selector` | Portal propio | Ver/cargar SOLO sus búsquedas, postulantes, comisiones y garantías |

La seguridad está **en la base de datos** (Row Level Security): aunque alguien manipule la API, un selector jamás puede ver datos de otro.

## Automatizaciones incluidas en la base

- Al marcar una postulación como **contratado** → se crea la **comisión** (con montos calculados) y la **garantía de 90 días** en la misma transacción.
- Todo cambio de estado de postulación queda en el **historial** automáticamente.
- Los **códigos de búsqueda** (`EMPR-PUES-TITU-0001`) se generan solos.
- Las transiciones de estado inválidas se **bloquean a nivel de base** para los selectores.
