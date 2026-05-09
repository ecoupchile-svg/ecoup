# Configuración de Supabase para ECOUP

## 1. Obtener credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon key** (clave pública)
   - **service_role key** (clave privada, solo para backend)

## 2. Configurar variables de entorno

Agregar al archivo `/app/backend/.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

## 3. Crear tablas en Supabase

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

```sql
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

CREATE POLICY "Los recicladores pueden actualizar solicitudes asignadas" ON requests
  FOR UPDATE USING (auth.uid() = recycler_id);

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

## 4. Configurar Storage en Supabase

1. Ve a **Storage** en el panel de Supabase
2. Crea un nuevo bucket llamado `evidence`
3. Configura el bucket como **Público** (para que las URLs sean accesibles)
4. Opcionalmente, configura políticas de almacenamiento:

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

## 5. Reiniciar el backend

Después de configurar las variables de entorno:

```bash
sudo supervisorctl restart backend
```

## 6. Verificar la configuración

Prueba el endpoint de health check:

```bash
curl https://ecoup-collab.preview.emergentagent.com/api/
```

Deberías recibir:
```json
{"message": "ECOUP API funcionando correctamente"}
```

## 7. Instrucciones para reconfigurar

Si necesitas cambiar de proyecto de Supabase:

1. Actualiza las variables en `/app/backend/.env`
2. Ejecuta los scripts SQL en el nuevo proyecto
3. Crea el bucket `evidence` en Storage
4. Reinicia el backend: `sudo supervisorctl restart backend`

## Notas de seguridad

- **NUNCA** compartas tu `service_role_key` públicamente
- La `anon_key` es segura para usar en el frontend
- Row Level Security (RLS) protege los datos a nivel de base de datos
- Las políticas RLS aseguran que los usuarios solo puedan acceder a sus propios datos
