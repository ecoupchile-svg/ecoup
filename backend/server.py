from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, List, Any
from supabase_client import supabase_admin
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Modelos Pydantic ───

class SignUpRequest(BaseModel):
    nombre: str
    email: str
    password: str
    role: str

class SignInRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    nombre: str
    email: str
    role: str

class RequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    waste_type: Optional[str] = None
    estimated_weight: Optional[float] = None
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    recycler_id: Optional[str] = None

class RatingCreate(BaseModel):
    request_id: str
    recycler_id: str
    rating: int
    comentario: Optional[str] = None

# ─── Helper: obtener usuario actual ───

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Falta el token de autorización")
    try:
        token = authorization.replace("Bearer ", "")
        user_response = supabase_admin.auth.get_user(token)
        return user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

# Helper: normalizar datos de request para respuesta
def normalize_request(data: dict) -> dict:
    return {
        "id": data.get("id", ""),
        "user_id": data.get("user_id", ""),
        "title": data.get("title", ""),
        "description": data.get("description"),
        "waste_type": data.get("waste_type"),
        "estimated_weight": data.get("estimated_weight"),
        "address": data.get("address", ""),
        "latitude": float(data["latitude"]) if data.get("latitude") is not None else None,
        "longitude": float(data["longitude"]) if data.get("longitude") is not None else None,
        "status": data.get("status", "PENDING"),
        "recycler_id": data.get("recycler_id"),
        "created_at": str(data.get("created_at", "")),
        "updated_at": str(data.get("updated_at", "")),
    }

# Helper: normalizar evidencia
def normalize_evidence(data: dict) -> dict:
    return {
        "id": data.get("id", ""),
        "request_id": data.get("request_id", ""),
        "recycler_id": data.get("recycler_id"),
        "image_url": data.get("image_url", ""),
        "latitude": float(data["latitude"]) if data.get("latitude") is not None else None,
        "longitude": float(data["longitude"]) if data.get("longitude") is not None else None,
        "notes": data.get("notes"),
        "created_at": str(data.get("created_at", "")),
    }

# ─── AUTH ───

@api_router.post("/auth/signup")
async def signup(request: SignUpRequest):
    try:
        # Intentar con admin API (auto-confirma)
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
            # Fallback: sign_up regular
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
            try:
                supabase_admin.auth.admin.update_user_by_id(
                    user_id, {"email_confirm": True}
                )
            except Exception:
                pass

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
    except Exception:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    try:
        profile = supabase_admin.table("users").select("*").eq("id", user.id).single().execute()
        return profile.data
    except Exception:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

# ─── REQUESTS ───

@api_router.post("/requests")
async def create_request(request: RequestCreate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    try:
        data = {
            "user_id": user.id,
            "title": request.title,
            "description": request.description,
            "waste_type": request.waste_type,
            "estimated_weight": request.estimated_weight,
            "address": request.address,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "status": "PENDING"
        }
        result = supabase_admin.table("requests").insert(data).execute()
        return normalize_request(result.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/requests")
async def get_user_requests(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    try:
        result = supabase_admin.table("requests").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return [normalize_request(r) for r in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/requests/available")
async def get_available_requests(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    try:
        result = supabase_admin.table("requests").select("*").or_(
            "status.eq.PENDING,recycler_id.eq.{}".format(user.id)
        ).order("created_at", desc=True).execute()
        return [normalize_request(r) for r in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    try:
        result = supabase_admin.table("requests").select("*").eq("id", request_id).single().execute()
        return normalize_request(result.data)
    except Exception:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

@api_router.patch("/requests/{request_id}")
async def update_request(request_id: str, update: RequestUpdate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    try:
        update_data = {}
        if update.status:
            update_data["status"] = update.status
        if update.recycler_id:
            update_data["recycler_id"] = update.recycler_id

        result = supabase_admin.table("requests").update(update_data).eq("id", request_id).execute()
        return normalize_request(result.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─── EVIDENCE ───

@api_router.post("/evidence/{request_id}")
async def upload_evidence(
    request_id: str,
    file: UploadFile = File(...),
    lat: float = Form(0),
    lng: float = Form(0),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(authorization)
    try:
        file_content = await file.read()
        ext = file.filename.split('.')[-1] if file.filename else "jpg"
        filename = f"evidence/{request_id}/{uuid.uuid4()}.{ext}"

        supabase_admin.storage.from_("evidence").upload(
            filename, file_content,
            {"content-type": file.content_type or "image/jpeg", "cacheControl": "3600"}
        )

        public_url = supabase_admin.storage.from_("evidence").get_public_url(filename)

        evidence = supabase_admin.table("evidence").insert({
            "request_id": request_id,
            "recycler_id": user.id,
            "image_url": public_url,
            "latitude": lat,
            "longitude": lng
        }).execute()

        supabase_admin.table("requests").update({
            "status": "EVIDENCE_UPLOADED"
        }).eq("id", request_id).execute()

        return normalize_evidence(evidence.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/evidence/{request_id}")
async def get_evidence(request_id: str, authorization: Optional[str] = Header(None)):
    await get_current_user(authorization)
    try:
        result = supabase_admin.table("evidence").select("*").eq("request_id", request_id).execute()
        return [normalize_evidence(e) for e in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── RATINGS ───

@api_router.post("/ratings")
async def create_rating(rating: RatingCreate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    try:
        result = supabase_admin.table("ratings").insert({
            "request_id": rating.request_id,
            "user_id": user.id,
            "recycler_id": rating.recycler_id,
            "rating": rating.rating,
            "comentario": rating.comentario
        }).execute()

        supabase_admin.table("requests").update({
            "status": "COMPLETED"
        }).eq("id", rating.request_id).execute()

        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/ratings/recycler/{recycler_id}")
async def get_recycler_ratings(recycler_id: str, authorization: Optional[str] = Header(None)):
    await get_current_user(authorization)
    try:
        result = supabase_admin.table("ratings").select("*").eq("recycler_id", recycler_id).execute()
        if not result.data:
            return {"average": 0, "count": 0, "ratings": []}
        total = sum(r["rating"] for r in result.data)
        return {
            "average": round(total / len(result.data), 1),
            "count": len(result.data),
            "ratings": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@api_router.get("/")
async def root():
    return {"message": "ECOUP API funcionando correctamente"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
