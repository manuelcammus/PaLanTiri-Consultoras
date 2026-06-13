# Manual Completo de Superusuario
## Palantiri Consultoras - Gestión Integral de Instancias

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Roles y Permisos](#roles-y-permisos)
3. [Dashboard: Lectura e Interpretación](#dashboard-lectura-e-interpretación)
4. [Crear una Consultora (Alta Completa)](#crear-una-consultora-alta-completa)
5. [Consola Palantiri: Monitoreo](#consola-palantiri-monitoreo)
6. [Gestión de Usuarios](#gestión-de-usuarios)
7. [Configuración de la Consultora](#configuración-de-la-consultora)
8. [Troubleshooting y Errores Comunes](#troubleshooting-y-errores-comunes)
9. [Tareas Diarias, Semanales, Mensuales](#tareas-diarias-semanales-mensuales)
10. [Apéndices](#apéndices)

---

## Introducción

### ¿Qué es un Superusuario?

Un **superusuario (super_admin)** es el administrador máximo de una instancia de Palantiri. Tiene acceso total a:
- Todas las consultoras clientes desplegadas
- Configuración global de la plataforma
- Gestión de usuarios y roles
- Monitoreo de salud e infraestructura
- Alertas automáticas y templates de notificación

**Responsabilidades principales:**
- Crear y dar de alta nuevas consultoras
- Monitorear que todas las instancias estén funcionando
- Resolver problemas técnicos de primera línea
- Configurar integraciones (Google, Resend, Turnstile, etc.)
- Auditar el uso de la plataforma

### Estructura de la Plataforma

```
TU INSTANCIA DE PALANTIRI (super_admin)
└── Consola Palantiri (monitoreo)
    ├── Consultora ConfiaRH
    │   ├── Dashboard (propio)
    │   ├── Usuarios (admin, staff)
    │   └── Datos (empresas, selectores, candidatos, etc.)
    ├── Consultora ABC
    │   ├── Dashboard
    │   ├── Usuarios
    │   └── Datos
    └── Consultora XYZ
        ├── Dashboard
        ├── Usuarios
        └── Datos
```

**Puntos clave:**
- Cada consultora tiene su **propia base de datos** (Supabase)
- Cada consultora tiene su **propio proyecto en Vercel** (mismo código, diferentes dominios)
- TÚ tienes acceso a una "Consola Palantiri" que solo ves vos
- Puedes entrar a cualquier consultora como super_admin desde la Consola

---

## Roles y Permisos

### Cinco niveles de acceso en la plataforma

| Rol | Dónde | Qué puede hacer | Quién lo asigna |
|---|---|---|---|
| **super_admin** | Panel de gestión | Todo. Ver todas las consultoras, crear usuarios, configurar integraciones, monitoreo | Sistema (al crear la instancia) |
| **admin** | Panel de gestión | Casi todo: empresas, búsquedas, selectores, postulantes, talentos, kanban, comisiones, garantías, KPIs, **Configuración** (identidad, Google, alertas) y **Usuarios** de su consultora (alta/baja de roles *consultora* y *selector*). NO: asignar roles admin/super_admin ni la Consola de monitoreo | super_admin |
| **usuario** | Panel de gestión | Lo mismo que admin pero SIN acceso a KPIs ni garantías. Para staff operativo | super_admin |
| **selector** | Portal selector | Sus búsquedas, postulantes, comisiones, garantías. No ve a otros selectores | super_admin |
| **(ninguno)** | Ninguno | Nada. Usuario creado pero sin acceso hasta que se asigne un rol | — |

### Matriz de permisos detallada

#### Panel de Gestión (Admin/Usuario/Super_admin)

| Módulo | Super_admin | Admin | Usuario |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Empresas | ✓ | ✓ | ✓ |
| Búsquedas | ✓ | ✓ | ✓ |
| Selectores | ✓ | ✓ | ✓ |
| Postulantes | ✓ | ✓ | ✓ |
| Base de talentos | ✓ | ✓ | ✓ |
| Tablero Kanban | ✓ | ✓ | ✓ |
| Entrevistas | ✓ | ✓ | ✓ |
| Comisiones | ✓ | ✓ | ✓ |
| Garantías | ✓ | ✓ | ✓ |
| KPIs | ✓ | ✓ | ✗ |
| **Usuarios** | ✓ | ✗ | ✗ |
| **Configuración** | ✓ | ✗ | ✗ |
| **Consola Palantiri** | ✓ | ✗ | ✗ |

---

## Dashboard: Lectura e Interpretación

### Componentes del Dashboard

El Dashboard es la primera pantalla que ves al entrar. Muestra:

#### 1. Alerta de Garantías (si hay)

```
⏳ Garantías que vencen en los próximos 15 días

• Juan Pérez — Desarrollador Senior (TechCorp) · vence el 2026-06-20 (en 7 días)
• María García — Diseñador UX (InnovateLabs) · vence hoy!
• Carlos López — Gerente de Proyectos (GlobalSys) · vence el 2026-06-25 (en 12 días)

→ Ir a Garantías
```

**Qué significa:**
- Las garantías de estos candidatos están por vencerse
- Necesitás verificar que sigan trabajando para no hacer devoluciones
- Hacé click en "Ir a Garantías" para marcarlas como completadas o incumplidas

**Acción recomendada:**
- Contactá a los selectores ese mismo día
- Coordiná con el cliente para confirmar que el candidato sigue en el puesto
- Marcá como "Completada" en el módulo de Garantías

#### 2. Tarjetas de Números Clave

```
🏢 Empresas activas: 15
🔍 Búsquedas abiertas: 8
🧑‍💼 Selectores activos: 24
👥 Postulantes en base: 847
📋 Postulaciones en proceso: 143
🛡️ Garantías vigentes: 52
```

**Interpretación rápida:**
- Si **Empresas activas** es bajo → falta prospección
- Si **Búsquedas abiertas** es bajo → pocos clientes demandantes
- Si **Selectores activos** es bajo → faltan reclutadores
- Si **Postulantes en base** crece cada mes → pool está mejorando
- Si **Postulaciones en proceso** es alto → mucha actividad (bueno)
- Si **Garantías vigentes** sigue creciendo → negocio creciendo

#### 3. Panel de KPIs (enlace)

```
¿Querés ver el funnel de conversión, el ranking de selectores y las series mensuales?
→ 📈 Ver panel de KPIs
```

Tocá este botón para ir a análisis más profundos.

### Cómo leer el Dashboard día a día

**Cada mañana (5 minutos):**
1. ¿Hay garantías por vencer? → Sí → accioná
2. ¿Los números de postulaciones están creciendo? → Sí → negocio saludable
3. ¿Hay "Búsquedas abiertas"? → No → avisá a comercial

---

## Crear una Consultora (Alta Completa)

### Paso a Paso: El Ejemplo de ConfiaRH

Datos del cliente:
- **Razón social:** ConfiaRH Soluciones Humanas
- **Contacto:** María García (maria@confiarh.com.ar, 549 1234567890)
- **Dominio:** confiarh.com.ar
- **Plan:** Pro
- **Vencimiento:** 31 dic 2026

---

### 1. Crear la base de datos en Supabase

**En [supabase.com/dashboard](https://supabase.com/dashboard):**

1. Tocá **"New Project"** (verde, arriba a la derecha)
2. Completa el formulario:
   - **Project Name:** `confiarh-prod`
   - **Database Password:** `P@ssw0rd!2024ConfiaRH#secure` (fuerte, con mayúscula, número, símbolo)
   - **Region:** South America (São Paulo)
   - **Pricing Plan:** Pro (si es primera venta, podes usar Free pero con limitaciones)
3. Tocá **"Create new project"** → espera 2-3 minutos

**Una vez creado:**

4. Abrí **Settings → API** (izquierda)
   - Copia: **Project URL** (ej. `https://xyzabc123.supabase.co`)
   - Copia: **Anon Key** (largo, empieza con `eyJhbGc...`)
   - Copia: **Service Role Key** (aún más largo, para operaciones privilegiadas)

**Guardalas en un documento seguro (ejemplo):**

```
=== CONFIARH CREDENTIALS ===
Supabase Project URL: https://xyzabc123.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Project ID: xyzabc123
Date: 2026-06-13
```

5. Ejecuta las **migraciones SQL**:
   - En Supabase, abrí **SQL Editor** (izquierda)
   - Para cada archivo (en orden), copia todo el contenido y pégalo en SQL Editor:
     - `webapp/supabase/migrations/0001_schema.sql`
     - `webapp/supabase/migrations/0002_rls.sql`
     - `webapp/supabase/migrations/0003_seed.sql`
     - `webapp/supabase/migrations/0004_storage.sql`
     - `webapp/supabase/migrations/0005_email_queue.sql`
     - `webapp/supabase/migrations/0006_configuracion_consultora.sql`
     - `webapp/supabase/migrations/0007_instancias_consultoras.sql`
   - Tocá **"RUN"** o **Ctrl+Enter** después de cada uno
   - ✔️ Verdes = OK

6. Crea el **usuario admin de ConfiaRH** (María es la **admin** de su consultora, NO super_admin — el super_admin sos vos):
   - Abrí **Authentication → Users** (izquierda)
   - Tocá **"Add user"** (verde, arriba) → **"Create new user"**
   - **Email:** `maria@confiarh.com.ar`
   - **Password:** `ConfiaRH2024!Temp` (temporal, ella la cambia al primer login)
   - ✅ **Tildá "Auto Confirm User"** (si no, Supabase le pide confirmar por email y no puede entrar)
   - Tocá **"Create user"**
   - ✔️ María aparece en la lista. El sistema le crea solo el perfil con rol `selector` por defecto — falta subirla a `admin` (paso 7).

   > **El UUID NO hace falta copiarlo:** el paso 7 la encuentra por su email.

7. **Asigna el rol `admin` a María**:
   - Abrí **SQL Editor** (izquierda) → **+ New query**
   - Pegá y ejecutá (ojo: **`admin`**, no `super_admin`):
   ```sql
   UPDATE public.profiles
   SET rol = 'admin'
   WHERE email = 'maria@confiarh.com.ar';
   ```
   - Tocá **RUN** (o Ctrl+Enter) → ✔️ "Affected rows: 1"
   - Esto funciona desde el SQL Editor porque corre con permisos de servidor. (Desde la app, solo un super_admin puede cambiar roles — es la protección anti-escalada.)

   > **¿Y vos (super_admin)?** Opcional: si querés acceso de soporte dentro de la instancia de ConfiaRH, repetí el paso 6 con tu email y en el paso 7 poné `SET rol = 'super_admin'`. Siempre tenés control total por las claves de Supabase de todos modos.

8. **Configura el CAPTCHA del login** (paso **obligatorio** del alta — ninguna instancia sale a producción sin él):
   - En Supabase, abrí **Authentication → Attack Protection**
   - **Enable Captcha protection:** ON
   - **Choose Captcha Provider:** Turnstile
   - **Captcha secret:** pegá el **Secret Key** de Cloudflare (paso 4 abajo)
   - **Save**
   - ⚠️ Las **tres piezas** del CAPTCHA tienen que estar puestas o **nadie puede entrar**: (1) activado acá en Supabase, (2) `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en Vercel, (3) el dominio de la consultora agregado al widget de Cloudflare (paso 4).

---

### 2. Crear el proyecto en Vercel

**En [vercel.com/dashboard](https://vercel.com/dashboard):**

1. Tocá **"Add New"** → **"Project"**
2. **Import Git Repository**:
   - Busca: `manuelcammus/PaLanTiri-Consultoras` (es tu repo)
   - Selecciona
3. Configuración del proyecto:
   - **Framework Preset:** Next.js (detecta solo)
   - **Root Directory:** `webapp` (IMPORTANTE: sin esto no funciona)
   - **Build Command:** por defecto (no cambies)
   - **Output Directory:** por defecto
4. **Environment Variables** (ANTES de desplegar):

Abre un editor de texto y prepara estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=https://confiarh.com.ar
RESEND_API_KEY=re_1234567890abcdef
EMAIL_FROM=ConfiaRH <noreply@confiarh.com.ar>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefgh1234567890
```

En Vercel, tocá **"Add Environment Variable"** y pegá cada una (o importa de golpe si hay opción).

5. **Deploy**:
   - Tocá **"Deploy"**
   - Espera 3-5 minutos
   - ✔️ Te dice "Congratulations, your project has been successfully deployed"

6. **Conectar dominio**:
   - En el proyecto de Vercel, abrí **Settings → Domains**
   - Tocá **"Add"**
   - Pega: `confiarh.com.ar`
   - Vercel te da instrucciones DNS: CNAME a `cname.vercel-dns.com`
   - María configura en su proveedor de dominio (Namecheap, Godaddy, etc.)
   - Espera ~10 minutos a que DNS se propague

**Test:** en 10 minutos, accedé a `https://confiarh.com.ar/login` → deberías ver el login

---

### 3. Configurar email (Resend)

**En [resend.com](https://resend.com):**

1. María crea su **propia cuenta** (no la tuya) con `maria@confiarh.com.ar`
2. **Domains** (izquierda) → **"Add Domain"**
3. Pega: `confiarh.com.ar`
4. Resend le da instrucciones:
   - SPF record: `v=spf1 include:resend.com ~all`
   - DKIM record: `k=rsa; p=MIGfMA0GCSq...` (ej.)
5. María agrega estos registros en su proveedor de dominio
6. De vuelta en Resend, **"Verify"** → espera confirmación
7. **API Keys** (izquierda) → **"Create API Key"**
8. María copia la key: `re_1234567890abcdef`
9. Esa key va en Vercel como `RESEND_API_KEY`

---

### 4. Configurar captcha (Cloudflare Turnstile) — OBLIGATORIO

El CAPTCHA es un **requisito** de cada consultora, no un extra. **No crees un widget nuevo por cliente:** usá un solo widget y agregale el dominio de cada consultora nueva.

**En [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile:**

**Primera vez (creás el widget una sola vez):**
1. **"Add widget"** (azul)
2. **Widget name:** `Palantiri` (uno para todas las consultoras)
3. **Hostnames:** agregá `confiarh.com.ar` (y el de cada consultora futura)
4. **Widget Mode:** Managed (por defecto) → **Create**
5. Copiá las dos claves (sirven para TODAS las consultoras):
   - **Site Key:** `1x00000000000000000000AA`
   - **Secret Key:** `1x00000000000000000000BB`

**Para cada consultora nueva (después de la primera):**
- Entrá al widget `Palantiri` → **Settings → Hostnames** → **agregá el dominio nuevo** (ej. el de la próxima consultora) → **Save**. Las claves NO cambian.

**Las TRES piezas tienen que estar puestas en cada consultora (si falta una, nadie entra):**
| # | Pieza | Dónde |
|---|---|---|
| 1 | Site Key | Vercel → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| 2 | Secret Key + CAPTCHA ON | Supabase → Authentication → Attack Protection |
| 3 | Dominio de la consultora | Cloudflare → widget `Palantiri` → Hostnames |

---

### 5. Google Calendar/Meet (para después, María lo configura)

**Nota:** Esto se puede dejar para después. María lo configura desde dentro de la app.

Cuando María quiera (en Configuración → Integración con Google):
- Tocá "Conectar con Google"
- Autoriza a la app
- Automático

---

### 6. WhatsApp Worker (opcional, para después)

Si María quiere enviar WhatsApp:

1. Enviá a María la carpeta `worker/`
2. Ella crea `worker/.env`:
   ```
   SUPABASE_URL=https://xyzabc123.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ```
3. Ella doble-clickea `worker\iniciar-whatsapp.bat`
4. Escanea QR con el número de ConfiaRH
5. Listo

---

### 7. Configuración inicial en la app (María lo hace)

María entra a `https://confiarh.com.ar`:
- Email: `maria@confiarh.com.ar`
- Password: la temporal que le diste

Abre **Configuración**:

1. **Identidad de la consultora**:
   - Nombre: `ConfiaRH`
   - Logo: sube logo de ConfiaRH (PNG/JPG)
   - Teléfono: `549 1234567890`
   - Email: `maria@confiarh.com.ar`
   - Sitio web: `https://www.confiarh.com.ar`

2. **Alertas automáticas**: revisa que email y WhatsApp estén ON

3. **Integración con Google**: conecta su cuenta de Google

---

### 8. Registrar en tu Consola Palantiri

Vos (en tu instancia):

1. Abrí **Consola Palantiri** (solo ves si sos super_admin)
2. Bajá a **"Registrar consultora"**
3. Completa:
   - **Nombre:** `ConfiaRH`
   - **URL:** `https://confiarh.com.ar`
   - **Notas:** `Plan Pro, contacto María García (maria@confiarh.com.ar, 549 1234567890), vence 31 dic 2026, worker WhatsApp activo, dominio configurado`
4. Tocá **"Agregar"**

✔️ ConfiaRH aparece en tu grilla

---

### Checklist de Alta Completa

```
[ ] Base Supabase creada y migrada (0001-0007)
[ ] Proyecto Vercel creado y deployado
[ ] Environment variables en Vercel (todas 9)
[ ] Dominio en Vercel y DNS configurado
[ ] Resend: cuenta, dominio verificado, API key
[ ] CAPTCHA (las 3 piezas): dominio en widget Cloudflare + Site Key en Vercel + Secret Key/ON en Supabase
[ ] Usuario María creado y es admin (no super_admin)
[ ] María puede entrar a https://confiarh.com.ar
[ ] María configura identidad en Configuración
[ ] (Opcional) Google conectado
[ ] (Opcional) Worker enviado a María
[ ] ConfiaRH registrada en tu Consola
[ ] Health check muestra 🟢 En línea
[ ] Test: envía un email de prueba, llega
[ ] Test: (si worker) envía WhatsApp de prueba, llega
```

---

## Consola Palantiri: Monitoreo

### Qué ves en la Consola

La Consola es tu panel de control central. Solo vos (super_admin) la ves.

#### Vista general

```
┌────────────────────────────────────────────────────────┐
│ CONSOLA PALANTIRI                                      │
│ Monitoreo de todas las consultoras desplegadas        │
│ 3/4 en línea                                           │
└────────────────────────────────────────────────────────┘

┌─── ConfiaRH ───────────────┐  ┌─── TechConsultores ────┐
│ 🟢 En línea                │  │ 🟢 En línea            │
│ https://confiarh.com.ar    │  │ https://techcons.com   │
│ v.a1b2c3d                  │  │ v.a1b2c3d              │
│ ⚡ 187 ms                  │  │ ⚡ 234 ms              │
│                            │  │                        │
│ ✓ DB ✓ Email ✓ Captcha   │  │ ✓ DB ✓ Email ✓ Captcha
│ ✓ Google                   │  │ ✗ Google               │
│                            │  │                        │
│ Plan Pro, María...         │  │ Plan Std, Juan...      │
│                            │  │                        │
│ [Panel] [Health] [Quitar]  │  │ [Panel] [Health]       │
└────────────────────────────┘  └────────────────────────┘

┌─── ABC Consultora ─────────┐
│ ⚫ Sin respuesta            │
│ https://abc-cons.vercel.app│
│ (no carga)                 │
│                            │
│ ⚠️ PROBLEMA - revisar      │
│                            │
│ [Panel] [Health] [Quitar]  │
└────────────────────────────┘

┌─ Registrar consultora ──────────────────────────────┐
│ Nombre: [consultora-xyz]                            │
│ URL: [https://]                                     │
│ Notas: [Plan...]                                    │
│ [Agregar]                                           │
└─────────────────────────────────────────────────────┘
```

#### Interpretación de cada tarjeta

**ConfiaRH (🟢 En línea):**
- ✅ Respondiendo bien
- ✅ Todos los servicios OK
- Latencia buena (187ms)
- Google conectado

**ABC Consultora (⚫ Sin respuesta):**
- ❌ No responde a `/api/health`
- Acción inmediata requerida
- Toca "Health" para ver el error

### Botones de cada tarjeta

| Botón | Qué hace |
|---|---|
| **Panel** | Te lleva al `/admin` de esa consultora (entras como super_admin) |
| **Health** | Abre `/api/health` → ves JSON crudo con estado, servicios, latencia |
| **Quitar** | Elimina la tarjeta de tu monitoreo (NO borra datos) |

### Monitoreo diario

**Cada mañana (3 minutos):**

1. Abrí Consola Palantiri
2. ¿Todas las tarjetas son 🟢? → Sí → todo OK, continúa
3. ¿Hay ⚫ o 🔴? → Tocá "Health" → analiza el error

**Errores típicos y qué significan:**

```json
{
  "status": "error",
  "consultora": "ConfiaRH",
  "version": "a1b2c3d",
  "servicios": {
    "db": false,  // ❌ Base de datos no responde
    "email": true,
    "captcha": true,
    "google": false
  },
  "latencia_ms": 0,
  "timestamp": "2026-06-13T08:45:00.000Z"
}
```

**Interpretación:**
- `db: false` → Supabase está caído o sin conectividad
- `email: false` → Resend no responde
- `google: false` → Normal si María aún no conectó Google
- `latencia_ms: 0` → Timeout, la instancia no respondió

**Acción:**
- Si `db: false` → contactá a María y revisá Supabase (https://supabase.com/dashboard)
- Si es timeout → la app puede estar caída, tocá "Panel" e intenta entrar

---

## Gestión de Usuarios

### Crear usuarios en una consultora

**Quién entra a Usuarios:** el **admin** de la consultora (María) y el **super_admin** (Palantiri). Cada consultora se autogestiona: el admin da de alta y administra a su propio equipo.

1. Abrí **Usuarios** en el menú lateral.
2. **"+ Crear nuevo usuario"**

Formulario:

```
Nombre: [María]
Apellido: [García]
Email: [maria.garcia@confiarh.com.ar]
Teléfono: [549 1234567890]
Rol: [Selector ▼]
```

**Roles que puede asignar cada uno:**

| Quién crea | Roles que ve en el desplegable |
|---|---|
| **admin** (María) | Consultora, Selector |
| **super_admin** (Palantiri) | Super Administrador, Administrador, Consultora, Selector |

Los roles **Administrador** y **Super Administrador** son exclusivos del super_admin: un admin no puede asignarlos ni modificar/eliminar cuentas que los tengan (aparecen como solo lectura). Es la protección anti-escalada.

**Qué hace cada rol:**
- **admin:** acceso total al panel, incluida Configuración y la gestión de usuarios *consultora*/*selector* de su consultora.
- **consultora (usuario):** panel pero sin KPIs ni garantías.
- **selector:** portal selector solo (al crear un selector con este rol, se vincula automáticamente con su registro de la tabla de selectores por email).
- (sin seleccionar): usuario bloqueado, sin acceso.

4. Tocá **"Crear usuario"**
5. La app:
   - Crea la cuenta en Supabase
   - **Envía un email de invitación** con link para definir contraseña
   - Usuario recibe el email, crea su password, accede

**Nota importante:** No te preocupes por la contraseña temporal. La app la maneja automáticamente.

### Editar usuarios

1. En **Usuarios**, busca al usuario
2. Tocá la tarjeta
3. Cambios posibles:
   - Nombre, apellido, teléfono (sin restricción)
   - Rol (cambiar permisos)
   - Activo/Inactivo (desactivar sin borrar)
4. **Guardar**

### Desactivar un usuario

En la fila del usuario, hay un checkbox **"Activo"**:
- ✓ Activo → puede entrar
- ☐ Inactivo → no puede entrar

Desactivá sin borrar si alguien se va pero podría volver.

### Case: Un usuario olvidó su contraseña

**El usuario hace:**
1. En el login, tocá "¿No tenés acceso? Contactá al administrador"
2. El administrador (María o vos) abre **Usuarios**
3. Busca al usuario
4. Toca **"Resetear contraseña"** → le manda un email con link nuevo

El usuario accede al link, crea nueva contraseña.

---

## Configuración de la Consultora

### 1. Identidad de la consultora

**Dónde:** Configuración → Identidad de la consultora

```
Nombre: [ConfiaRH]
Logo: [sube imagen] 📷 (PNG, JPG, WebP)
Teléfono: [549 1234567890]
Email de contacto: [maria@confiarh.com.ar]
Sitio web: [https://www.confiarh.com.ar]
```

**Qué afecta:**
- El nombre y logo aparecen en el login, menús y emails
- Si lo cambias, se actualiza al instante para todos los usuarios
- El teléfono y email aparecen en notificaciones automáticas

### 2. Integración con Google

**Dónde:** Configuración → Integración con Google

**Estado posibles:**

```
🟢 Conectado
Cuenta: maria.garcia@gmail.com
Servicios: Calendar (✓), Meet (✓)
[Desconectar]
```

O:

```
⚫ No conectado
Para agendar entrevistas con Meet automático, conectá tu cuenta de Google.
[Conectar con Google]
```

**Qué permite:**
- Agendar entrevistas → crea automáticamente el evento en Google Calendar
- Google Meet → genera sala automática y manda el link
- Google Drive → guardar CVs en el Drive de la consultora

**Cómo conectar:**
- Tocá "Conectar con Google"
- Se abre consent screen de Google
- Usuario autoriza (puede ser María o cualquier admin)
- La app guarda el token
- ✔️ Listo

**Error típico:** "Google no se conecta"

Si aparece error tipo "invalid_grant", pídele a María que desconecte y reconecte.

### 3. Alertas automáticas

**Dónde:** Configuración → Alertas automáticas

Tabla de los 4 eventos:

```
EVENTO: Nueva búsqueda
- Activar email: ☑️
- Plantilla email: [Hola {nombre_selector}, te asignamos...]
- Activar WhatsApp: ☑️
- Plantilla WhatsApp: [Hola, nueva búsqueda de {titulo_puesto}...]

EVENTO: Candidato contratado
- Activar email: ☑️
- [plantilla]
- Activar WhatsApp: ☑️
- [plantilla]

EVENTO: Comisión pagada
- Activar email: ☑️
- [plantilla]
- Activar WhatsApp: ☑️
- [plantilla]

EVENTO: Garantía ejecutada
- Activar email: ☑️
- [plantilla]
- Activar WhatsApp: ☑️
- [plantilla]
```

**Variables disponibles en plantillas:**
- `{nombre_selector}` - nombre del selector
- `{titulo_puesto}` - título del puesto
- `{empresa_nombre}` - nombre de la empresa
- `{candidato_nombre}` - nombre del candidato
- `{monto_comision}` - monto de la comisión
- `{monto_devolucion}` - monto de clawback en garantía incumplida

**Ejemplo de personalizaciónutorial:**

Default:
```
Hola {nombre_selector}, te asignamos la búsqueda de {titulo_puesto} en {empresa_nombre}.
```

Personalizado:
```
Hola {nombre_selector}! 🎯 Nueva oportunidad para {empresa_nombre}:
Búsqueda: {titulo_puesto}
¿Te animas? Entrá al portal para más detalles.
Saludos,
El equipo de ConfiaRH
```

### 4. Estados de postulante

**Dónde:** Configuración → Estados → Postulante

Define los estados que ves cuando filtras postulantes. Cada estado tiene:
- Nombre (ej. "Disponible", "En proceso", "Contratado")
- Color (badge de color en las tarjetas)

Ejemplo por defecto:
```
Disponible (verde)
En búsqueda activa (azul)
En entrevista (naranja)
Contratado (verde oscuro)
Inactivo (gris)
```

Edita si ConfiaRH quiere estados especiales.

### 5. Históricos y logs

**Dónde:** Configuración → Últimos emails / Últimos WhatsApp

**Vista:**

```
ÚLTIMOS EMAILS ENVIADOS

| Fecha | Destinatario | Asunto | Estado | Error |
|---|---|---|---|---|
| 2026-06-13 08:30 | juan@x.com | Nueva búsqueda | ✓ Enviado | — |
| 2026-06-13 07:45 | maria@y.com | Comisión pagada | ✓ Enviado | — |
| 2026-06-12 18:00 | carlos@z.com | Garantía | ✗ Error | Invalid email |
| 2026-06-12 17:30 | pedro@w.com | Candidato contratado | ⏳ Pendiente | — |

ÚLTIMOS WHATSAPP

| Fecha | Número | Mensaje | Estado | Error |
|---|---|---|---|---|
| 2026-06-13 08:32 | 549 1111111 | Hola Juan... | ✓ Enviado | — |
| 2026-06-13 07:50 | 549 2222222 | Hola María... | ⏳ Pendiente | Worker apagado |
| 2026-06-12 18:05 | 549 3333333 | Hola Carlos... | ✗ Error | Número inválido |
```

**Colores:**
- ✓ Verde = Enviado exitosamente
- ⏳ Ámbar = Pendiente (esperando ser enviado)
- ✗ Rojo = Error, no se envió

**Acciones:**
- Tocá sobre una fila para ver detalles
- Para los ⏳ Pendientes, hay un botón **"Reintentar"**
- Para los ✗ Error, revisa el motivo (email inválido, teléfono inválido, etc.)

**Envío de prueba:**

Abajo hay un formulario para probar:

```
[Encolar WhatsApp de prueba]
Teléfono: [549 1234567890]
Mensaje: [Mensaje de prueba de la plataforma ✅]
[Encolar WhatsApp de prueba]
```

Tocá para encolar un WhatsApp, verás cómo llega. Útil para verificar que el worker funciona.

---

## Troubleshooting y Errores Comunes

### Tabla de diagnóstico rápido

| Síntoma | Causa probable | Solución |
|---|---|---|
| Consola muestra ⚫ Sin respuesta | Base caída o app sin conectividad | Tocá "Health", reviá Supabase |
| Email no llega | Resend no conectado o dominio no verificado | En Resend, verifica dominio DNS |
| WhatsApp no llega | Worker apagado o número inválido | María corre el .bat o verifica teléfono |
| Login no funciona | Usuario no existe o contraseña incorrecta | Crea usuario, envía invitación |
| Google no conecta | Token expirado o permisos insuficientes | Desconecta y reconecta |
| No puedo crear empresa | Rol sin permisos | Usuario debe ser admin o super_admin |

### Caso 1: ConfiaRH no responde (⚫ Sin respuesta)

**Síntoma en Consola:**
```
ConfiaRH
⚫ Sin respuesta
https://confiarh.com.ar
```

**Diagnóstico:**

1. Tocá "Health" → probablemente ves:
   ```json
   Error: 504 Gateway Timeout
   ```
   O la request no devuelve nada.

2. **Posibles causas:**
   - Supabase está caído
   - Vercel está caído (raro)
   - La app consume mucha memoria
   - Problema de DNS

**Soluciones en orden:**

**Opción A - Reinicia el worker de WhatsApp (si está activo):**
- Pedile a María que cierre la ventana del `iniciar-whatsapp.bat`
- Espera 30 segundos
- Que lo abra de nuevo
- Espera 1 minuto
- Intenta acceder a la app

**Opción B - Verifica Supabase:**
- Accedé a https://supabase.com/dashboard
- Entra al proyecto `confiarh-prod`
- Abrí **SQL Editor**
- Ejecutá: `SELECT 1` (query simple)
- ✓ Funciona → Supabase OK
- ✗ Error → Supabase caído, contactá a Supabase support

**Opción C - Reinicia el proyecto Vercel:**
- En https://vercel.com/dashboard, abrí el proyecto ConfiaRH
- Abrí **Deployments**
- Tocá el último deployment
- Tocá **"Redeploy"**
- Espera 3 minutos

**Opción D - Revisa DNS:**
- En tu computadora, abre terminal y corre:
  ```
  nslookup confiarh.com.ar
  ```
- Debería resolver a una IP de Vercel (ej. `104.16.x.x`)
- Si no resuelve, el dominio no está configurado en Vercel

**Si nada funciona:**
1. Contactá a María y preguntá si ella puede acceder desde otra red (celular)
2. Si ella tampoco puede, es problema del servidor
3. Intenta un redeploy manual en Vercel y espera 5 minutos

---

### Caso 2: Email no llega

**Síntoma:**
- Usuario completa formulario → dice que se envió el email
- Pero el usuario NO recibe nada
- Configuración muestra: ✓ Email conectado

**Diagnóstico:**

1. En Configuración → **Últimos emails enviados**
   - ¿Está el email en la tabla?
   - ¿Qué estado tiene?

**Opción A - Email está como ✓ Enviado:**

Entonces Resend lo aceptó pero el usuario no lo recibió:
- ¿Está en spam? → Dile que revise spam
- ¿Dominio no verificado en Resend? → Verifica en https://resend.com/domains
- ¿Dirección de email es válida? → Prueba enviando a tu email

**Opción B - Email está como ✗ Error:**

Lee el error específico:
- `Invalid email` → email mal escrito (ej. sin @)
- `Forbidden` → API key de Resend inválida o expirada
- `Rate limited` → demasiados emails en poco tiempo

**Solución general:**
1. Verifica que `RESEND_API_KEY` esté en Vercel (Settings → Env variables)
2. Verifica que el dominio esté verificado en Resend (Settings → Domains)
3. Redeployá en Vercel (puede ser que la API key nueva no haya llegado)

---

### Caso 3: WhatsApp no llega

**Síntoma:**
- Se dispara un evento (ej. "Nueva búsqueda")
- Configuración → Últimos WhatsApp muestra ⏳ Pendiente desde hace 15 minutos
- El número se ve: 549 1111111

**Diagnóstico:**

1. **¿Está la alerta roja en la Consola?**
   ```
   ⚠️ Hay mensajes pendientes desde hace más de 15 minutos: 
   el worker de WhatsApp parece estar apagado.
   ```
   
   → **Sí:** el worker no está corriendo. Sigue Solución A.
   → **No:** worker corre pero hay otro problema. Sigue Solución B.

2. **Solución A - Worker apagado:**
   - Pedile a María que abra `worker\iniciar-whatsapp.bat`
   - Espera 30 segundos (escanea QR si es primera vez)
   - En menos de 1 minuto, el WhatsApp se envía solo

3. **Solución B - Worker corre pero hay error:**
   - En Configuración, los WhatsApp de hace 15 min muestran ✗ Error
   - Lee el error:
     - `Número inválido` → número no está en formato correcto (549...). Verifica el teléfono en la base de datos del selector.
     - `Mensaje vacío` → la plantilla de WhatsApp está vacía en Alertas automáticas. Llénala.
     - `Worker desconectado` → el worker se desconectó de Supabase. Pedile que lo reinicie.

**Prueba rápida:**
- En Configuración, usa el formulario **"Encolar WhatsApp de prueba"**
- Pon tu propio número
- Espera 30 segundos
- Si recibís el mensaje → worker funciona, el problema es selectivo
- Si NO recibís → worker no anda, pídele a María que lo inicie

---

### Caso 4: Usuario no puede entrar

**Síntoma:**
- Usuario intenta entrar
- Dice: `Email o contraseña incorrectos`
- Está seguro de que escribió bien

**Diagnóstico:**

1. **¿El usuario existe?**
   - En **Usuarios**, búscalo
   - ¿Lo ves en la lista?
   
   → **No existe:** crea al usuario (ver sección "Gestión de usuarios")
   → **Existe:** continúa paso 2

2. **¿Está activo?**
   - En la fila del usuario, ¿hay un checkbox ☑️ "Activo"?
   
   → **No está tildado:** tildá y guarda
   → **Está tildado:** continúa paso 3

3. **¿Hizo el onboarding de contraseña?**
   - Cuando creas un usuario, la app le envía un email con un link
   - El usuario debe clickear el link y crear su propia contraseña
   - Si no hizo eso, no puede entrar
   
   **Solución:** En **Usuarios**, tocá **"Resetear contraseña"** para el usuario
   - Se envía un nuevo email
   - Usuario hace click, crea contraseña nueva
   - Intenta entrar de nuevo

---

### Caso 5: Puedo entrar pero no veo opciones

**Síntoma:**
- Entras al `/admin`
- Ves el Dashboard
- Pero NO ves otros menús (Empresas, Búsquedas, etc.)

**Diagnóstico:**

Tu rol no es `super_admin`. Probablemente eres `admin` o `usuario`.

**Solución:**
- En **Usuarios**, encontrá tu usuario
- Edita el rol: cámbialo a `super_admin`
- Guarda
- Refrescá el navegador
- Ahora deberías ver todo

---

## Tareas Diarias, Semanales, Mensuales

### Tareas diarias (5-10 minutos)

**Cada mañana:**

- [ ] Abrí Consola Palantiri
- [ ] ¿Todas las consultoras son 🟢? → Sí → continúa
- [ ] ¿Hay ⚫ o 🔴? → Investigá (tocá "Health")
- [ ] En Dashboard, ¿hay garantías vencidas? → Sí → contactá selectores
- [ ] ¿Los números de postulaciones crecen? → Buena señal de salud

**Máximo 10 minutos. Si algo necesita más, déjalo anotado para mañana.**

### Tareas semanales (30 minutos)

**Cada lunes:**

- [ ] En cada consultora, revisá **KPIs** (tablero de conversión, ranking selectores)
- [ ] Tasa de colocación subiendo o bajando?
- [ ] Hay selectores poco activos? → Contactá a María
- [ ] Comisiones pagadas esta semana? → Verificá en pago
- [ ] Garantías ejecutadas? → Revisá los reclamos

### Tareas mensuales (1 hora)

**Último día del mes:**

- [ ] **Revisá facturación:** cada consultora debería tener movimiento
- [ ] **Audita usuarios:** ¿hay cuentas inactivas que deberían cerrarse?
- [ ] **Revisa integraciones:** Google conectado? Worker activo?
- [ ] **Planifica capacitaciones:** ¿nuevos usuarios necesitan onboarding?
- [ ] **Revisa costos:** Supabase + Vercel + Resend. ¿Está dentro del presupuesto?

---

## Apéndices

### A. Glosario

**Admin:** Persona con acceso total al panel de gestión de su consultora, incluida Configuración y la gestión de usuarios *consultora*/*selector*. No puede asignar roles admin/super_admin ni ver la Consola de monitoreo.

**Selector:** Reclutador externo que ve sus búsquedas asignadas, carga candidatos, sigue comisiones.

**Consultora:** Cliente que renta la plataforma. Cada consultora es una instancia independiente.

**Instancia:** Copia independiente de la app (base datos, proyecto Vercel, dominio propio).

**Super_admin:** Persona con acceso total a la instancia, incluida Consola Palantiri.

**Health check:** Endpoint `/api/health` que devuelve estado de la app (base datos, email, captcha, Google).

**RLS (Row Level Security):** Reglas de Supabase que garantizan que cada usuario ve solo sus propios datos.

### B. Tablas de referencia rápida

#### Roles y acceso

| Rol | Dashboard | Empresas | Búsquedas | Selectores | KPIs | Usuarios | Config | Consola |
|---|---|---|---|---|---|---|---|---|
| super_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| usuario | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| selector | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

#### Estados de postulación

| Estado | Color | Significado | Siguiente |
|---|---|---|---|
| Enviada | Azul | Se envió al cliente | Recibida |
| Recibida | Violeta | Cliente recibió | Entrevista |
| Entrevista | Púrpura | En entrevista | Oferta |
| Oferta | Naranja | Se ofreció el puesto | Aceptada |
| Aceptada | Verde | Candidato aceptó | Contratado |
| Contratado | Verde oscuro | Entró a trabajar | Garantía |
| Rechazada (empresa) | Rojo | Cliente rechazó | — |
| Rechazada (postulante) | Rojo | Candidato rechazó | — |
| Cancelada | Gris | Se canceló | — |

#### Estados de garantía

| Estado | Color | Significado | Acción |
|---|---|---|---|
| Vigente | Ámbar | En garantía | Vigilar, completar o incumplir |
| Completada | Verde | Pasó la garantía | Cerrar |
| Incumplida | Rojo | No pasó la garantía | Devolución calculada |
| Anulada | Gris | Se anuló | Cerrar |

### C. URLs y accesos rápidos

Para **ConfiaRH** (ejemplo):

| Recurso | URL |
|---|---|
| Panel admin | https://confiarh.com.ar/admin |
| Portal selector | https://confiarh.com.ar/portal |
| Health check | https://confiarh.com.ar/api/health |
| Supabase | https://supabase.com/dashboard → confiarh-prod |
| Vercel | https://vercel.com/dashboard → confiarh |
| Resend | https://resend.com → dominio confiarh.com.ar |
| Turnstile | https://dash.cloudflare.com → ConfiaRH |

---

## Conclusión

Leído completamente este manual, estás capacitado para:

✅ Crear nuevas consultoras desde cero
✅ Monitorear todas tus instancias en la Consola
✅ Gestionar usuarios y roles
✅ Configurar integraciones (Google, email, WhatsApp)
✅ Diagnosticar y resolver problemas comunes
✅ Mantener la salud diaria de la plataforma

**Si algo no anda:**
1. Consulta la tabla de diagnóstico (Troubleshooting)
2. Sigue los pasos ordenados
3. Si persiste, contactá a soporte (indicar el error exacto y el endpoint)

**¡Bienvenido al club de superusuarios!** 🚀
