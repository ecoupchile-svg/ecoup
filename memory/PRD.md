# ECOUP - Product Requirements Document

## Problem Statement
Aplicación web de reciclaje colaborativo llamada ECOUP con dos tipos de usuario: Usuario Hogar y Reciclador. Conectada a Supabase, con mapas Leaflet/OpenStreetMap, diseño mobile-first.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Leaflet
- **Backend**: FastAPI (proxy a Supabase)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (bucket: evidence)
- **Auth**: Supabase Auth con roles (USER/RECYCLER)

## User Personas
1. **Usuario Hogar (USER)**: Crea solicitudes de reciclaje, valida evidencias, califica recicladores
2. **Reciclador (RECYCLER)**: Ve solicitudes disponibles, acepta, recolecta, sube evidencia

## Core Requirements
- Auth: Registro con nombre/email/password/rol, Login, Sesión persistente
- Solicitudes: CRUD con estados PENDING→ACCEPTED→IN_PROGRESS→EVIDENCE_UPLOADED→COMPLETED
- Evidencia: Foto + GPS + timestamp
- Validación: Usuario confirma o reporta problema
- Calificación: 1-5 estrellas con comentario
- UI: Mobile-first, colores #C8F135 y #2BBFB3, español

## What's Been Implemented (May 9, 2026)
- ✅ Backend completo con todos los endpoints API
- ✅ Auth (signup/login/me/logout) con Supabase
- ✅ CRUD de solicitudes adaptado a estructura existente de Supabase
- ✅ Subida de evidencia con Supabase Storage
- ✅ Sistema de calificaciones
- ✅ Frontend completo: AuthPage, HomePage, CreateRequest, RequestDetail, UploadEvidence, History, Profile
- ✅ Sesión persistente via localStorage
- ✅ Bottom navigation
- ✅ Diseño mobile-first con app shell max-w-md
- ✅ Testing: Backend 100%, Frontend 95%

## Test Accounts
- USER: maria@ecoup.com / Test12345!
- RECYCLER: carlos@ecoup.com / Test12345!

## Prioritized Backlog
### P0 (Done)
- Auth, Solicitudes, Evidencia, Calificaciones, UI completa

### P1 (Next)
- Notificaciones push/email
- Dashboard de estadísticas para reciclador
- Filtros de solicitudes por tipo de residuo/ubicación

### P2
- Chat entre usuario y reciclador
- Gamificación (puntos, badges)
- Panel de administración
- Historial detallado con métricas
