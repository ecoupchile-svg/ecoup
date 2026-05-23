# ReciclaMarket

Marketplace de reciclaje que conecta usuarios con recicladores.

## Estado de produccion

Esta version incluye una primera pasada de hardening para publicacion:

- `.gitignore` para no subir `.env.local`, `.next` ni `node_modules`.
- `.env.example` con las variables requeridas.
- middleware de Next para proteger `/dashboard` desde el servidor.
- migracion SQL de hardening con RLS, triggers de transicion de estados e indices.
- validacion basica de email y evidencia fotografica.

Antes de abrir la app a usuarios reales, ejecuta la migracion de hardening en Supabase y prueba el flujo completo con cuentas reales.

## Setup local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variables requeridas:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## Base de datos

Para una instalacion nueva, ejecuta en el SQL Editor de Supabase:

1. `supabase/schema.sql`
2. `supabase/20260514_production_hardening.sql`

La migracion de hardening restringe RLS y bloquea transiciones invalidas:

```text
PENDING -> ACCEPTED -> IN_PROGRESS -> EVIDENCE_UPLOADED -> COMPLETED
```

## Deploy en Vercel

1. Sube el proyecto a GitHub sin `.env.local`, `.next` ni `node_modules`.
2. Importa el repo en Vercel.
3. Configura las variables de entorno de Supabase en Vercel.
4. En Supabase Auth, configura las URL permitidas:
   - `http://localhost:3000`
   - tu dominio de produccion
5. Ejecuta `npm run check` antes de publicar.

## Checklist antes del lanzamiento

- Crear proyecto Supabase de produccion separado del desarrollo.
- Ejecutar `schema.sql` y `20260514_production_hardening.sql`.
- Probar registro, login, crear solicitud, aceptar, iniciar, subir evidencia y calificar.
- Revisar reglas de negocio para aprobacion/verificacion de recicladores.
- Configurar backups de Supabase.
- Agregar monitoreo de errores antes de escalar usuarios.
- Publicar terminos, privacidad y canal de soporte.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run check
```
