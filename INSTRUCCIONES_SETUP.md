# 🌱 ECOUP - Instrucciones de Configuración

## ✅ Lo que ya está listo

- ✅ Backend FastAPI configurado con todos los endpoints
- ✅ Frontend React con todas las páginas y componentes
- ✅ Dependencias instaladas (Supabase, Leaflet, etc.)
- ✅ Diseño mobile-first completamente implementado

---

## 🚀 Pasos para hacer funcionar ECOUP

### **PASO 1: Configurar Supabase**

#### 1.1 Obtener credenciales

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Settings** → **API**
4. Copia estas 3 credenciales:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon key** (clave pública)
   - **service_role key** (clave privada)

#### 1.2 Configurar variables de entorno

**Backend** - Edita `/app/backend/.env`:
```bash
# Reemplaza estos valores con tus credenciales reales
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Frontend** - Edita `/app/frontend/.env`:
```bash
# Reemplaza estos valores con tus credenciales reales
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **PASO 2: Crear tablas en Supabase**

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y ejecuta este SQL completo:

```sql
-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'RECYCLER')),
  created_at TIMESTAMP DEFAULT now()
);

-- Tabla de solicitudes
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direccion TEXT NOT NULL,
  descripcion TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'EVIDENCE_UPLOADED', 'COMPLETED')),
  recycler_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabla de evidencias
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Tabla de calificaciones
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  recycler_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para requests
CREATE POLICY "Los usuarios pueden ver sus propias solicitudes" ON requests
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = recycler_id);

CREATE POLICY "Los usuarios pueden crear solicitudes" ON requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los recicladores pueden ver solicitudes pendientes" ON requests
  FOR SELECT USING (status = 'PENDING' OR auth.uid() = recycler_id);

CREATE POLICY "Los usuarios pueden actualizar sus solicitudes" ON requests
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = recycler_id);

-- Políticas RLS para evidence
CREATE POLICY "Los usuarios pueden ver evidencias de sus solicitudes" ON evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = evidence.request_id
      AND (requests.user_id = auth.uid() OR requests.recycler_id = auth.uid())
    )
  );

CREATE POLICY "Los recicladores pueden crear evidencias" ON evidence
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = evidence.request_id
      AND requests.recycler_id = auth.uid()
    )
  );

-- Políticas RLS para ratings
CREATE POLICY "Los usuarios pueden ver calificaciones" ON ratings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = recycler_id);

CREATE POLICY "Los usuarios pueden crear calificaciones" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_recycler_id ON requests(recycler_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_evidence_request_id ON evidence(request_id);
CREATE INDEX idx_ratings_recycler_id ON ratings(recycler_id);
```

---

### **PASO 3: Configurar Storage en Supabase**

1. En tu proyecto de Supabase, ve a **Storage**
2. Haz clic en **Create a new bucket**
3. Nombre del bucket: `evidence`
4. Marca como **Public** (para que las URLs sean accesibles)
5. Haz clic en **Create bucket**

#### Configurar políticas de Storage:

En **SQL Editor**, ejecuta:

```sql
-- Política para permitir subir evidencias
CREATE POLICY "Los recicladores pueden subir evidencias" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence' AND
    auth.role() = 'authenticated'
  );

-- Política para ver evidencias
CREATE POLICY "Todos pueden ver evidencias" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence');
```

---

### **PASO 4: Reiniciar servicios**

Después de configurar las variables de entorno, ejecuta:

```bash
sudo supervisorctl restart backend frontend
```

---

### **PASO 5: Verificar que funciona**

1. **Backend**: 
   ```bash
   curl https://ecoup-collab.preview.emergentagent.com/api/
   ```
   Deberías ver: `{"message":"ECOUP API funcionando correctamente"}`

2. **Frontend**: 
   Abre en tu navegador: `https://ecoup-collab.preview.emergentagent.com`
   Deberías ver la página de login/registro

---

## 📱 Cómo usar la aplicación

### Como Usuario Hogar:
1. Regístrate eligiendo "Usuario Hogar"
2. Crea una solicitud de reciclaje
3. Espera a que un reciclador la acepte
4. Revisa la evidencia cuando el reciclador la suba
5. Confirma y califica el servicio

### Como Reciclador:
1. Regístrate eligiendo "Reciclador"
2. Ve las solicitudes disponibles
3. Acepta una solicitud
4. Marca como "En progreso" cuando vayas
5. Sube evidencia (foto + GPS)
6. Espera la confirmación del usuario

---

## 🎨 Características de diseño

- **Mobile-first**: Optimizado para celulares
- **Colores**: Verde lima (#C8F135) y turquesa (#2BBFB3)
- **Bottom Navigation**: Navegación tipo app nativa
- **Bottom Sheets**: Modales desde abajo
- **Mapas**: Leaflet con OpenStreetMap
- **GPS**: Captura de ubicación en tiempo real
- **Cámara**: Captura de fotos directa

---

## 🔧 Troubleshooting

### Error: "Faltan las credenciales de Supabase"
**Solución**: Verifica que configuraste correctamente las variables en `/app/backend/.env` y `/app/frontend/.env`

### Error: "relation 'users' does not exist"
**Solución**: Ejecuta el SQL del PASO 2 en el SQL Editor de Supabase

### Error: "bucket 'evidence' not found"
**Solución**: Crea el bucket 'evidence' en Storage de Supabase (PASO 3)

### La app no carga
**Solución**: Reinicia los servicios con `sudo supervisorctl restart backend frontend`

### No puedo subir fotos
**Solución**: Verifica que el bucket 'evidence' existe y es público

---

## 📦 Deploy a Vercel (opcional)

El código está listo para deployment en Vercel:

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel:
   - `REACT_APP_BACKEND_URL`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
3. Deploy automático

---

## 📚 Documentación adicional

- **SUPABASE_SETUP.md**: Guía detallada de configuración de Supabase
- **Backend endpoints**: Documentados en `/app/backend/server.py`
- **Componentes frontend**: En `/app/frontend/src/components/`

---

## ✨ ¡Todo listo!

Una vez completados estos pasos, tu aplicación ECOUP estará funcionando completamente. 🚀

¿Necesitas ayuda? Revisa el apartado de Troubleshooting o pregunta lo que necesites.
