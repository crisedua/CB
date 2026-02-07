# Sistema de Gestión de Incendios - Bomberos de Chile

Sistema web para escanear, extraer y gestionar información de formularios de incidentes de bomberos usando IA.

## 🚀 Características

### Escaneo y Extracción
- ✅ Escaneo de formularios de incidentes (2 páginas)
- ✅ Extracción automática con GPT-4o Vision
- ✅ Almacenamiento de imágenes originales
- ✅ Re-escaneo de documentos existentes
- ✅ Extracción de 50+ campos

### Gestión de Documentos
- ✅ Lista de todos los documentos escaneados
- ✅ Vista detallada de cada incidente
- ✅ **Edición inline de todos los campos**
- ✅ Visualización de imágenes escaneadas
- ✅ Tablas relacionadas (vehículos, personas, instituciones)

### Reportes y Análisis
- ✅ Dashboard con KPIs y gráficos
- ✅ Informes mensuales con cumplimiento
- ✅ Análisis por naturaleza y compañía
- ✅ Exportación a PDF

### Seguridad (OWASP Top 10)
- ✅ Autenticación requerida (Supabase Auth)
- ✅ Row Level Security (RLS)
- ✅ Validación y sanitización de inputs
- ✅ Rate limiting (10 req/min)
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Audit logging completo
- ✅ Prevención de XSS e inyección SQL
- ✅ Almacenamiento seguro

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Almacenamiento**: Supabase Storage
- **IA**: OpenAI GPT-4o Vision
- **Autenticación**: Supabase Auth
- **Gráficos**: Recharts
- **Despliegue**: Vercel

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta de Supabase
- API Key de OpenAI
- Cuenta de Vercel (para despliegue)

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd CB
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

En Vercel Dashboard > Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### 4. Configurar base de datos

1. Ir a Supabase Dashboard > SQL Editor
2. Ejecutar en orden:
   - `migration_step1_create_tables.sql`
   - `migration_step2_add_columns.sql`
   - `migration_step3_add_policies.sql`
   - `migrations/add_authentication_security.sql`

### 5. Configurar almacenamiento

1. Ir a Supabase Dashboard > Storage
2. Crear bucket `incident-scans`
3. Hacer el bucket privado
4. Agregar políticas de autenticación (ver `SETUP_SECURITY.md`)

### 6. Habilitar autenticación

1. Ir a Supabase Dashboard > Authentication > Providers
2. Habilitar "Email" provider
3. Configurar plantillas de email (opcional)

### 7. Desplegar

```bash
git add .
git commit -m "Initial deployment"
git push
```

Vercel desplegará automáticamente.

## 🔐 Seguridad

Este proyecto implementa las mejores prácticas de seguridad OWASP Top 10:

- **A01**: Control de acceso con RLS
- **A03**: Prevención de inyección
- **A04**: Rate limiting
- **A05**: Configuración segura
- **A07**: Autenticación robusta
- **A09**: Logging de auditoría

Ver documentación completa en:
- `SECURITY.md` - Documentación detallada
- `SETUP_SECURITY.md` - Guía de configuración
- `SECURITY_QUICK_REFERENCE.md` - Referencia rápida

## 📖 Uso

### Escanear un documento

1. Ir a "Escanear Documento"
2. Subir las 2 páginas del formulario
3. Hacer clic en "Procesar Documento"
4. Esperar la extracción automática
5. Revisar los datos extraídos

### Editar un documento

1. Ir a "Documentos"
2. Hacer clic en un documento
3. Hacer clic en "Editar"
4. Modificar los campos necesarios
5. Hacer clic en "Guardar"

### Re-escanear un documento

1. Abrir un documento
2. Hacer clic en "Re-escanear"
3. Confirmar la acción
4. Los datos se actualizarán automáticamente

### Ver reportes

1. Ir a "Informes" para reportes mensuales
2. Ir a "Cuadro de Mando" para dashboard visual
3. Exportar a PDF si es necesario

## 🧪 Testing

### Test de seguridad

```bash
# Test rate limiting (debe fallar en la 11ª petición)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/extract \
    -H "Content-Type: application/json" \
    -d '{"images":[]}'
done
```

### Test de sanitización

1. Editar un documento
2. Ingresar: `<script>alert('xss')</script>`
3. Guardar
4. Verificar que los tags se eliminaron

### Ver audit logs

```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📁 Estructura del Proyecto

```
CB/
├── app/
│   ├── api/
│   │   └── extract/          # API de extracción con IA
│   ├── components/           # Componentes reutilizables
│   ├── dashboard/            # Dashboard con KPIs
│   ├── documents/            # Gestión de documentos
│   │   └── [id]/            # Detalle y edición
│   ├── informes/            # Reportes mensuales
│   ├── login/               # Página de login
│   ├── scan/                # Escaneo de documentos
│   └── signup/              # Página de registro
├── lib/
│   └── supabase.ts          # Cliente de Supabase
├── migrations/              # Migraciones SQL
├── middleware.ts            # Security headers
├── SECURITY.md             # Documentación de seguridad
├── SETUP_SECURITY.md       # Guía de configuración
└── package.json
```

## 🔄 Flujo de Datos

1. Usuario sube imágenes → `app/scan/page.tsx`
2. Imágenes se guardan en Supabase Storage
3. Se envían a OpenAI GPT-4o Vision → `app/api/extract/route.ts`
4. Datos extraídos se guardan en PostgreSQL
5. Usuario puede ver/editar → `app/documents/[id]/page.tsx`
6. Cambios se registran en audit logs
7. Reportes se generan desde la base de datos

## 🐛 Troubleshooting

### "User not authenticated"
- Verificar que la migración de seguridad se ejecutó
- Verificar que la autenticación está habilitada
- Iniciar sesión en `/login`

### Rate limiting no funciona
- Verificar `SUPABASE_SERVICE_ROLE_KEY` en Vercel
- Verificar que la tabla `rate_limits` existe
- Revisar logs de Vercel

### Errores de storage
- Verificar que el bucket es privado
- Verificar que las políticas de storage existen
- Verificar que el usuario está autenticado

Ver más en `SETUP_SECURITY.md`

## 📊 Base de Datos

### Tablas principales:
- `incidents` - Datos principales del incidente
- `incident_vehicles` - Vehículos involucrados
- `incident_involved_people` - Personas involucradas
- `incident_institutions` - Instituciones presentes
- `audit_logs` - Registro de auditoría
- `rate_limits` - Control de rate limiting

Ver esquema completo en `supabase_schema_complete.sql`

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto es privado y confidencial.

## 👥 Autores

- Desarrollo inicial - Sistema de Gestión de Incendios

## 🙏 Agradecimientos

- Bomberos de Chile por los requisitos
- OpenAI por GPT-4o Vision
- Supabase por la infraestructura
- Vercel por el hosting

## 📞 Soporte

Para problemas o preguntas:
1. Revisar `SECURITY.md` y `SETUP_SECURITY.md`
2. Revisar logs de Vercel
3. Revisar logs de Supabase
4. Contactar al equipo de desarrollo

---

**Versión**: 1.0  
**Última actualización**: Febrero 2026  
**Estado**: ✅ Producción
