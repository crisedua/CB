# 🚨 SOLUCIÓN DE EMERGENCIA - PROTECCIÓN DE DATOS PERSONALES

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO

Actualmente CUALQUIER persona con el link puede:
- Ver datos sensibles (nombres, RUN, direcciones)
- Editar información
- Borrar documentos
- Sin ninguna autenticación

**Esto viola la Ley 19.628 de Protección de Datos Personales de Chile.**

---

## 🔥 SOLUCIÓN INMEDIATA (15 minutos)

### PASO 1: Ejecutar Migración de Seguridad (5 min)

1. Ir a Supabase Dashboard: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **SQL Editor** (menú izquierdo)
4. Copiar TODO el contenido de `migrations/add_authentication_security.sql`
5. Pegar en el editor
6. Click en **RUN** (esquina superior derecha)
7. Verificar que dice "Success. No rows returned"

**Esto bloqueará INMEDIATAMENTE el acceso público a todos los datos.**

---

### PASO 2: Habilitar Autenticación (3 min)

1. En Supabase Dashboard, ir a **Authentication** > **Providers**
2. Buscar "Email"
3. Click en **Enable**
4. **IMPORTANTE**: Desmarcar "Confirm email" (para acceso inmediato)
5. Click en **Save**

---

### PASO 3: Crear Usuario Administrador (2 min)

1. En Supabase Dashboard, ir a **Authentication** > **Users**
2. Click en **Add user** > **Create new user**
3. Ingresar:
   - Email: tu-email@bomberos.cl
   - Password: (contraseña segura, mínimo 8 caracteres)
   - **Desmarcar** "Auto Confirm User" si está marcado
4. Click en **Create user**

---

### PASO 4: Asegurar Storage (3 min)

1. Ir a **Storage** > **incident-scans**
2. Click en el ícono de configuración (⚙️)
3. **DESMARCAR** "Public bucket"
4. Click en **Save**
5. Ir a la pestaña **Policies**
6. Click en **New Policy** > **For full customization**
7. Crear 4 políticas:

**Política 1: SELECT (Ver)**
```sql
CREATE POLICY "Auth users can view"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'incident-scans');
```

**Política 2: INSERT (Subir)**
```sql
CREATE POLICY "Auth users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'incident-scans');
```

**Política 3: UPDATE (Actualizar)**
```sql
CREATE POLICY "Auth users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'incident-scans');
```

**Política 4: DELETE (Borrar)**
```sql
CREATE POLICY "Auth users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'incident-scans');
```

---

### PASO 5: Agregar Variable de Entorno (2 min)

1. Ir a Vercel Dashboard: https://vercel.com
2. Seleccionar tu proyecto
3. Ir a **Settings** > **Environment Variables**
4. Click en **Add New**
5. Agregar:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: (copiar de Supabase Dashboard > Settings > API > service_role)
   - **Environments**: Marcar Production, Preview, Development
6. Click en **Save**

---

### PASO 6: Re-desplegar (1 min)

1. En Vercel Dashboard, ir a **Deployments**
2. Click en los 3 puntos (...) del último deployment
3. Click en **Redeploy**
4. Esperar que termine (1-2 minutos)

---

## ✅ VERIFICACIÓN

Después de completar los pasos:

1. Abrir tu sitio en modo incógnito
2. Intentar acceder a `/documents`
3. **DEBE redirigir a `/login`** o mostrar error
4. Si aún puedes ver documentos sin login: **CONTACTAR INMEDIATAMENTE**

---

## 🔒 DESPUÉS DE LA SOLUCIÓN DE EMERGENCIA

Una vez que hayas completado los pasos anteriores, los datos estarán protegidos. Luego puedes:

1. Ir a tu sitio y hacer login en `/login`
2. Crear más usuarios en Supabase Dashboard > Authentication > Users
3. Compartir credenciales solo con personal autorizado

---

## 📞 SI ALGO FALLA

Si después de estos pasos aún hay acceso público:

### Opción Nuclear (Bloquear TODO temporalmente):

```sql
-- Ejecutar en Supabase SQL Editor
-- Esto bloqueará TODO acceso hasta que se arregle

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_involved_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_institutions ENABLE ROW LEVEL SECURITY;

-- Borrar TODAS las políticas públicas
DROP POLICY IF EXISTS "Allow Public Insert Incidents" ON incidents;
DROP POLICY IF EXISTS "Allow Public Select Incidents" ON incidents;
DROP POLICY IF EXISTS "Allow Public Update Incidents" ON incidents;
DROP POLICY IF EXISTS "Allow Public Delete Incidents" ON incidents;

DROP POLICY IF EXISTS "Allow Public Insert Vehicles" ON incident_vehicles;
DROP POLICY IF EXISTS "Allow Public Select Vehicles" ON incident_vehicles;
DROP POLICY IF EXISTS "Allow Public Update Vehicles" ON incident_vehicles;
DROP POLICY IF EXISTS "Allow Public Delete Vehicles" ON incident_vehicles;

DROP POLICY IF EXISTS "Allow Public Insert People" ON incident_involved_people;
DROP POLICY IF EXISTS "Allow Public Select People" ON incident_involved_people;
DROP POLICY IF EXISTS "Allow Public Update People" ON incident_involved_people;
DROP POLICY IF EXISTS "Allow Public Delete People" ON incident_involved_people;

DROP POLICY IF EXISTS "Allow Public Insert Institutions" ON incident_institutions;
DROP POLICY IF EXISTS "Allow Public Select Institutions" ON incident_institutions;
DROP POLICY IF EXISTS "Allow Public Update Institutions" ON incident_institutions;
DROP POLICY IF EXISTS "Allow Public Delete Institutions" ON incident_institutions;
```

Esto bloqueará TODO hasta que se configure correctamente la autenticación.

---

## ⚖️ CUMPLIMIENTO LEGAL

Una vez implementado esto, estarás cumpliendo con:

✅ **Ley 19.628** - Protección de Datos Personales
- Art. 4: Datos solo accesibles por personal autorizado
- Art. 11: Medidas de seguridad implementadas
- Art. 12: Acceso controlado y registrado (audit logs)

✅ **Ley 20.575** - Principio de Finalidad
- Datos solo accesibles para su propósito (gestión de incidentes)

✅ **Ley 21.096** - Neutralidad de la Red
- Seguridad de la información implementada

---

## 📋 CHECKLIST DE EMERGENCIA

- [ ] Paso 1: Migración ejecutada ✓
- [ ] Paso 2: Autenticación habilitada ✓
- [ ] Paso 3: Usuario admin creado ✓
- [ ] Paso 4: Storage asegurado ✓
- [ ] Paso 5: Variable de entorno agregada ✓
- [ ] Paso 6: Re-desplegado ✓
- [ ] Verificación: No hay acceso público ✓

---

## ⏱️ TIEMPO TOTAL: ~15 minutos

**EJECUTAR AHORA MISMO PARA PROTEGER LOS DATOS.**

---

**Última actualización**: Ahora mismo
**Prioridad**: 🚨 CRÍTICA
**Estado**: Pendiente de implementación
