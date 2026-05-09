from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from supabase_client import supabase_admin
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Crear la app principal
app = FastAPI()

# Crear router con prefijo /api
api_router = APIRouter(prefix="/api")

# Modelos Pydantic
class SignUpRequest(BaseModel):
    nombre: str
    email: str
    password: str
    role: str  # USER o RECYCLER

class SignInRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    nombre: str
    email: str
    role: str

class RequestCreate(BaseModel):
    direccion: str
    descripcion: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class RequestResponse(BaseModel):
    id: str
    user_id: str
    direccion: str
    descripcion: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    status: str
    recycler_id: Optional[str]
    created_at: str
    updated_at: str

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    recycler_id: Optional[str] = None

class EvidenceCreate(BaseModel):
    lat: float
    lng: float

class EvidenceResponse(BaseModel):
    id: str
    request_id: str
    photo_url: str
    lat: float
    lng: float
    uploaded_at: str

class RatingCreate(BaseModel):
    request_id: str
    recycler_id: str
    rating: int
    comentario: Optional[str] = None

class RatingResponse(BaseModel):
    id: str
    request_id: str
    user_id: str
    recycler_id: str
    rating: int
    comentario: Optional[str]
    created_at: str

# Función auxiliar para obtener usuario actual
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Falta el token de autorización")
    
    try:
        token = authorization.replace("Bearer ", "")
        user_response = supabase_admin.auth.get_user(token)
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token inválido")

# Endpoints de autenticación
@api_router.post("/auth/signup", response_model=UserResponse)
async def signup(request: SignUpRequest):
    try:
        # Intentar con admin API primero (auto-confirma)
        try:
            auth_response = supabase_admin.auth.admin.create_user({
                "email": request.email,
                "password": request.password,
                "email_confirm": True,
                "user_metadata": {
                    "nombre": request.nombre,
                    "role": request.role
                }
            })
            user_id = auth_response.user.id
        except Exception:
            # Fallback: usar sign_up regular
            auth_response = supabase_admin.auth.sign_up({
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {
                        "nombre": request.nombre,
                        "role": request.role
                    }
                }
            })
            user_id = auth_response.user.id
            # Intentar auto-confirmar
            try:
                supabase_admin.auth.admin.update_user_by_id(
                    user_id, {"email_confirm": True}
                )
            except Exception:
                pass
        
        # Crear perfil de usuario en la tabla users
        supabase_admin.table("users").insert({
            "id": user_id,
            "nombre": request.nombre,
            "email": request.email,
            "role": request.role
        }).execute()
        
        return {
            "id": user_id,
            "nombre": request.nombre,
            "email": request.email,
            "role": request.role
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/login")
async def login(request: SignInRequest):
    try:
        response = supabase_admin.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        user = response.user
        session = response.session
        
        # Obtener información del perfil
        profile = supabase_admin.table("users").select("*").eq("id", user.id).single().execute()
        
        return {
            "access_token": session.access_token,
            "user": {
                "id": user.id,
                "nombre": profile.data.get("nombre", ""),
                "email": user.email,
                "role": profile.data.get("role", "USER")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        profile = supabase_admin.table("users").select("*").eq("id", user.id).single().execute()
        return profile.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Perfil de usuario no encontrado")

# Endpoints de solicitudes
@api_router.post("/requests", response_model=RequestResponse)
async def create_request(request: RequestCreate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        new_request = supabase_admin.table("requests").insert({
            "user_id": user.id,
            "direccion": request.direccion,
            "descripcion": request.descripcion,
            "lat": request.lat,
            "lng": request.lng,
            "status": "PENDING"
        }).execute()
        
        return new_request.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/requests", response_model=List[RequestResponse])
async def get_user_requests(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        requests = supabase_admin.table("requests").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return requests.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/requests/available", response_model=List[RequestResponse])
async def get_available_requests(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        # Obtener solicitudes pendientes o del reciclador actual
        requests = supabase_admin.table("requests").select("*").or_("status.eq.PENDING,recycler_id.eq.{}".format(user.id)).order("created_at", desc=True).execute()
        return requests.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/requests/{request_id}", response_model=RequestResponse)
async def get_request(request_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        request = supabase_admin.table("requests").select("*").eq("id", request_id).single().execute()
        return request.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

@api_router.patch("/requests/{request_id}", response_model=RequestResponse)
async def update_request(request_id: str, update: RequestUpdate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        update_data = {}
        if update.status:
            update_data["status"] = update.status
        if update.recycler_id:
            update_data["recycler_id"] = update.recycler_id
        
        updated_request = supabase_admin.table("requests").update(update_data).eq("id", request_id).execute()
        return updated_request.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Endpoints de evidencia
@api_router.post("/evidence/{request_id}")
async def upload_evidence(
    request_id: str,
    file: UploadFile = File(...),
    lat: float = 0,
    lng: float = 0,
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(authorization)
    
    try:
        file_content = await file.read()
        
        # Generar nombre único para el archivo
        file_extension = file.filename.split('.')[-1]
        filename = f"{request_id}/{uuid.uuid4()}.{file_extension}"
        
        # Subir a Supabase Storage
        storage_response = supabase_admin.storage.from_("evidence").upload(
            filename,
            file_content,
            {
                "content-type": file.content_type,
                "cacheControl": "3600"
            }
        )
        
        # Obtener URL pública
        public_url = supabase_admin.storage.from_("evidence").get_public_url(filename)
        
        # Guardar metadatos en la tabla evidence
        evidence = supabase_admin.table("evidence").insert({
            "request_id": request_id,
            "photo_url": public_url,
            "lat": lat,
            "lng": lng
        }).execute()
        
        # Actualizar estado de la solicitud
        supabase_admin.table("requests").update({
            "status": "EVIDENCE_UPLOADED"
        }).eq("id", request_id).execute()
        
        return evidence.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/evidence/{request_id}", response_model=List[EvidenceResponse])
async def get_evidence(request_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        evidence = supabase_admin.table("evidence").select("*").eq("request_id", request_id).execute()
        return evidence.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoints de calificaciones
@api_router.post("/ratings", response_model=RatingResponse)
async def create_rating(rating: RatingCreate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        new_rating = supabase_admin.table("ratings").insert({
            "request_id": rating.request_id,
            "user_id": user.id,
            "recycler_id": rating.recycler_id,
            "rating": rating.rating,
            "comentario": rating.comentario
        }).execute()
        
        # Actualizar estado de la solicitud a COMPLETED
        supabase_admin.table("requests").update({
            "status": "COMPLETED"
        }).eq("id", rating.request_id).execute()
        
        return new_rating.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/ratings/recycler/{recycler_id}")
async def get_recycler_ratings(recycler_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    
    try:
        ratings = supabase_admin.table("ratings").select("*").eq("recycler_id", recycler_id).execute()
        
        if not ratings.data:
            return {"average": 0, "count": 0, "ratings": []}
        
        total = sum([r["rating"] for r in ratings.data])
        average = total / len(ratings.data)
        
        return {
            "average": round(average, 1),
            "count": len(ratings.data),
            "ratings": ratings.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@api_router.get("/")
async def root():
    return {"message": "ECOUP API funcionando correctamente"}

# Incluir el router en la app principal
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
