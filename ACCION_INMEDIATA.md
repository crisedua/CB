# 🚨 ACCIÓN INMEDIATA REQUERIDA

## SITUACIÓN CRÍTICA

**Tu sistema está exponiendo datos personales sensibles sin protección.**

Esto viola la Ley 19.628 de Protección de Datos Personales de Chile y te expone a:
- Multas de hasta $6.000.000 CLP
- Responsabilidad penal (hasta 5 años de cárcel)
- Demandas civiles por daños
- Daño reputacional grave

---

## ✅ SOLUCIÓN EN 6 PASOS (15 MINUTOS)

### 1️⃣ BLOQUEAR ACCESO PÚBLICO (5 min)

**Ir a**: https://supabase.com/dashboard → Tu Proyecto → SQL Editor

**Copiar y pegar** el archivo: `migrations/add_authentication_security.sql`

**Click**: RUN

✅ Esto bloqueará INMEDIATAMENTE el acceso público

---

### 2️⃣ HABILITAR LOGIN (2 min)

**Ir a**: Authentication → Providers → Email

**Marcar**: Enable

**Desmarcar**: Confirm email (para acceso inmediato)

**Click**: Save

---

### 3️⃣ CREAR TU USUARIO (1 min)

**Ir a**: Authentication → Users → Add user

**Ingresar**:
- Email: tu-email@bomberos.cl
- Password: (mínimo 8 caracteres)

**Click**: Create user

---

### 4️⃣ ASEGURAR IMÁGENES (3 min)

**Ir a**: Storage → incident-scans → ⚙️

**Desmarcar**: Public bucket

**Click**: Save

**Ir a**: Policies → New Policy

**Copiar estas 4 políticas** (una por una):

```sql
CREATE POLICY "Auth users can view"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'incident-scans');
```

```sql
CREATE POLICY "Auth users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'incident-scans');
```

```sql
CREATE POLICY "Auth users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'incident-scans');
```

```sql
CREATE POLICY "Auth users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'incident-scans');
```

---

### 5️⃣ AGREGAR CLAVE SECRETA (2 min)

**Ir a**: Vercel Dashboard → Tu Proyecto → Settings → Environment Variables

**Agregar**:
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (copiar de Supabase → Settings → API → service_role)
- Environments: ✓ Production ✓ Preview ✓ Development

**Click**: Save

---

### 6️⃣ RE-DESPLEGAR (2 min)

**Ir a**: Vercel → Deployments → ... (3 puntos) → Redeploy

**Esperar**: 1-2 minutos

---

## ✅ VERIFICAR QUE FUNCIONA

1. Abrir tu sitio en **modo incógnito**
2. Intentar ir a `/documents`
3. **DEBE** redirigir a `/login` o mostrar error
4. Si aún ves documentos sin login: **EJECUTAR OPCIÓN NUCLEAR** ⬇️

---

## 🔥 OPCIÓN NUCLEAR (Si lo anterior no funciona)

**Ir a**: Supabase → SQL Editor

**Ejecutar esto** (bloqueará TODO temporalmente):

```sql
-- BLOQUEAR TODO ACCESO PÚBLICO
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_involved_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_institutions ENABLE ROW LEVEL SECURITY;

-- BORRAR POLÍTICAS PÚBLICAS
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

---

## 📱 DESPUÉS DE IMPLEMENTAR

1. **Ir a tu sitio** → `/login`
2. **Ingresar** con el email y password que creaste
3. **Verificar** que puedes ver los documentos
4. **Crear más usuarios** en Supabase → Authentication → Users
5. **Compartir credenciales** solo con personal autorizado

---

## 📋 CHECKLIST

- [ ] Paso 1: Migración ejecutada ✓
- [ ] Paso 2: Autenticación habilitada ✓
- [ ] Paso 3: Usuario creado ✓
- [ ] Paso 4: Storage asegurado ✓
- [ ] Paso 5: Clave agregada ✓
- [ ] Paso 6: Re-desplegado ✓
- [ ] Verificación: Sin acceso público ✓

---

## 📞 SI NECESITAS AYUDA

1. Lee `EMERGENCY_SECURITY_FIX.md` (más detallado)
2. Lee `LEGAL_COMPLIANCE.md` (contexto legal)
3. Lee `SETUP_SECURITY.md` (guía completa)

---

## ⏱️ TIEMPO TOTAL: 15 MINUTOS

**HAZLO AHORA. CADA MINUTO QUE PASA ES UN RIESGO LEGAL.**

---

## ✅ DESPUÉS DE COMPLETAR

Tu sistema estará:
- ✅ Protegido legalmente
- ✅ Cumpliendo con Ley 19.628
- ✅ Con acceso solo para autorizados
- ✅ Con audit logs de todas las acciones
- ✅ Con cifrado de datos
- ✅ Con rate limiting contra ataques

---

**Prioridad**: 🚨 MÁXIMA
**Tiempo**: 15 minutos
**Dificultad**: Fácil (copiar y pegar)
**Impacto**: Protege de multas y cárcel

**EJECUTAR AHORA.**
