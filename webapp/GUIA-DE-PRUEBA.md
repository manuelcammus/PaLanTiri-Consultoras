# Guía de prueba — Plataforma Palantiri Consultoras

Recorrido completo para probar toda la funcionalidad, en el orden natural del
negocio. Cada paso indica qué hacer y qué tiene que pasar.

**La app tiene dos zonas según el rol del usuario:**

| Zona | Quién entra | Qué hay |
|---|---|---|
| **Panel de gestión** (`/admin`) | super_admin, admin, usuarios de la consultora | Dashboard, KPIs, empresas, búsquedas, selectores, postulantes, talentos, kanban, entrevistas, comisiones, garantías, configuración |
| **Portal selector** (`/portal`) | selectores | Sus búsquedas, sus postulantes, carga de candidatos, sus comisiones y garantías |

---

## 0. Entrar

1. Ir a la URL de la app → pantalla de login con el logo y nombre de la
   consultora + captcha.
2. Entrar con tu usuario admin. ✔️ Te lleva al Dashboard.

## 1. Configuración inicial (una sola vez)

En **Configuración**:

1. **Identidad de la consultora**: cambiá nombre/logo → ✔️ se actualiza el
   login, el menú y el título de la pestaña.
2. **Integración con Google** → "Conectar con Google" → ✔️ cartel verde.
   Habilita: Meet automático en entrevistas y CVs en Drive.
3. **Alertas automáticas**: revisá plantillas y tildes de email/WhatsApp de
   los 4 eventos.

## 2. Crear una empresa cliente

**Empresas → + Nueva empresa** → completar y guardar. ✔️ Aparece en el listado.

## 3. Crear una búsqueda

**Búsquedas → + Nueva búsqueda**: elegir empresa, puesto, condiciones,
salario; subir **flyer** (imagen) si tenés. Guardar.
✔️ Aparece en el listado con estado y "Sin asignar".

## 4. Crear un selector (alta automática de cuenta)

**Selectores → + Nuevo selector**: datos + email real.
✔️ Al guardar: se crea el selector **y** le llega un **email de invitación**
para definir su contraseña (pantalla `/set-password`). Después puede entrar
al **portal** con su email y clave.

> Modo prueba de Resend: los emails solo llegan a la casilla con la que te
> registraste en Resend. Con dominio propio verificado llegan a cualquiera.

## 5. Asignar la búsqueda al selector

**Búsquedas → (abrir la búsqueda) → panel SELECTORES ASIGNADOS** (abajo) →
elegir selector → **Asignar selector**.
✔️ Dispara el evento `nueva_busqueda`: email al selector + WhatsApp encolado.
⚠️ El combo "Selector asignado" de la sección Gestión es solo informativo:
**no** envía notificaciones.

## 6. El selector trabaja (portal)

Entrando como selector:

1. **Mis Búsquedas** → la asignación aparece "Nueva" → **Aceptar**.
2. **Cargar Postulante** → elegir la búsqueda, datos del candidato y **CV**
   (PDF/Word). ✔️ El CV va al **Drive de la consultora** (carpeta
   "CVs - Plataforma Palantiri") si Google está conectado; si no, a Supabase.
   El texto del CV se indexa solo para búsquedas.
3. **Mis Postulantes** → ✔️ el candidato figura con su postulación "enviada".

## 7. Seguir la postulación (Kanban)

**Tablero Kanban** (admin): cada columna es un estado. En la tarjeta, elegir
estado nuevo → **Mover**.

Flujo válido: enviada → recibida → entrevista → oferta → aceptada → **contratado**.

✔️ Al mover a **Contratado** pasan 4 cosas automáticas:
- Se calcula y crea la **comisión** (montos por porcentajes configurados)
- Se crea la **garantía** con su vencimiento
- Email `candidato_contratado` al selector (+ WhatsApp)
- La fecha de cierre queda registrada

## 8. Entrevistas

**Entrevistas** (admin):

1. **Agendar**: elegir postulación, tipo, fecha/hora, entrevistador (si ponés
   su email, lo invita), dejar el link de Meet vacío y el checkbox de Google
   tildado → **Agendar entrevista**.
   ✔️ Aparece en "Próximas" con botón **📹 Meet**; el evento está en el
   Calendar de la consultora; candidato y entrevistador reciben la invitación.
2. Pasada la fecha, la entrevista salta a **"Pendientes de resultado"** →
   registrar Favorable/Desfavorable/etc. → ✔️ pasa al Historial.
3. "Cancelar" una próxima → ✔️ borra también el evento del Calendar.

## 9. Base de talentos (reutilizar candidatos)

**Base de talentos** (admin): buscador del pool histórico.

1. Búsqueda libre: probá una palabra que esté **solo dentro del CV** →
   ✔️ lo encuentra igual (texto extraído).
2. Filtros: experiencia, estado, ubicación, modalidad, presupuesto, mudanza.
3. En la tarjeta: **Ver CV**, LinkedIn, ficha, historial de búsquedas previas.
4. **Presentar**: elegir una búsqueda abierta → ✔️ crea la postulación (y
   avisa si ya estaba presentado).

## 10. Comisiones

**Comisiones** (admin): la comisión creada al contratar aparece en el listado.

1. Abrir el detalle → **Registrar pago** (monto, fecha, método).
   ✔️ Dispara `comision_pagada`: email al selector (y al de sourcing si hay).
2. El selector la ve en su portal en **Mis Comisiones**.

## 11. Garantías

**Garantías** (admin): la garantía creada al contratar figura "vigente".

- Si el candidato no supera el período: cambiar estado a **Incumplida** +
  motivo → ✔️ dispara `garantia_ejecutada` con el monto de devolución
  (clawback) por email al selector.
- Si lo supera: marcarla **Completada**.
- ✔️ Las garantías que vencen en los próximos 15 días aparecen como **alerta
  ámbar en el Dashboard**, con los días restantes de cada una.

## 12. KPIs

**KPIs** (admin): funnel de conversión, tasa de colocación, time-to-fill,
ranking de selectores, comisiones (facturado/pagado/pendiente), series
mensuales y tasa de garantías. ✔️ Con los datos de esta prueba ya se puebla.

## 13. Historiales de notificaciones

**Configuración** (abajo): "Últimos emails enviados" y "Últimos WhatsApp"
con estado de cada uno (verde enviado / ámbar pendiente / rojo error — el
error se ve pasando el mouse). Además:

- **Encolar WhatsApp de prueba**: ponés un teléfono (formato libre) y un
  mensaje → queda en cola para que el worker lo mande.
- **Reintentar**: los mensajes en error tienen botón para volver a la cola.
- ⚠️ Si hay pendientes hace más de 15 minutos, aparece un aviso de que el
  worker está apagado.
- Los emails salen con plantilla con la marca de la consultora y la firma
  "Un producto de Palantiri Consultoras".

## 14. WhatsApp (worker local)

Los WhatsApp quedan "pendiente" hasta que el worker corre en tu PC:

1. Doble click en **`worker\iniciar-whatsapp.bat`** (instala lo necesario la
   primera vez).
2. Primera vez: escanear el QR con el teléfono de la consultora
   (WhatsApp → Dispositivos vinculados).
3. Dejar la ventana abierta. ✔️ Los pendientes salen en segundos y pasan a
   "enviado".

## 15. Consola Palantiri (solo super_admin)

**Consola Palantiri**: registro y monitoreo de cada consultora desplegada.

- **URL = la dirección web donde vive la app de esa consultora** (su dominio
  de Vercel). Para tu propia instancia: `https://pa-lan-tiri-consultoras.vercel.app`.
- La consola NO crea instancias: primero se despliega la consultora
  (ALTA-CONSULTORA.md) y después se registra acá para monitorearla.
- ✔️ Cada tarjeta muestra: En línea/Sin respuesta, versión, servicios
  (DB/Email/Captcha/Google) y accesos directos.

## 16. Usuarios y roles (solo super_admin)

**Usuarios**: crear cuentas del equipo con rol (admin / usuario / selector),
activar/desactivar y editar.

---

## Automatizaciones de infraestructura (GitHub Actions)

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `ping-instancias.yml` | 2 veces/día | Visita `/api/health` de cada instancia para que Supabase free nunca se pause. Si una no responde, GitHub te avisa por email. |
| `backup-bases.yml` | Todas las noches (02:30 AR) | `pg_dump` de cada base, cifrado AES-256, guardado 30 días como artefacto. Requiere secrets `BACKUP_PASSPHRASE` y `SUPABASE_DB_URL_<INSTANCIA>`. |

Se ven/corren a mano en GitHub → pestaña **Actions**.

## Prueba en el celular

Abrí la app desde el teléfono: tanto el panel como el portal muestran una
**barra de navegación superior** con todos los accesos (la barra lateral es
solo para pantallas grandes). Probá especialmente el portal del selector,
que es el que más se usa desde el móvil.

## Limitaciones conocidas (estado actual)

1. **Emails**: Resend en modo prueba → solo llegan a tu casilla. Se resuelve
   con dominio propio verificado.
2. **WhatsApp**: requiere el worker corriendo en una PC con sesión de
   WhatsApp Web (por diseño, para costo $0).
3. **Kanban**: el cambio de estado es con selector + botón "Mover" (sin
   drag & drop todavía).
4. **Informes de entrevista** (formulario largo del selector) y **Google
   Contacts**: de la app vieja, aún no portados.
5. **Vercel Hobby**: válido hasta la primera venta → pasar a Pro (USD 20/mes).
