from supabase import create_client, Client
from dotenv import load_dotenv
import os
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Verificar si las credenciales están configuradas
if not SUPABASE_URL or SUPABASE_URL == "TU_SUPABASE_URL_AQUI":
    print("\n" + "="*80)
    print("⚠️  CONFIGURACIÓN REQUERIDA")
    print("="*80)
    print("\nECOUP necesita credenciales de Supabase para funcionar.")
    print("\nPor favor sigue estos pasos:")
    print("\n1. Ve a https://supabase.com y obtén tus credenciales")
    print("2. Edita /app/backend/.env y reemplaza:")
    print("   - SUPABASE_URL")
    print("   - SUPABASE_ANON_KEY")
    print("   - SUPABASE_SERVICE_ROLE_KEY")
    print("\n3. Edita /app/frontend/.env y reemplaza:")
    print("   - REACT_APP_SUPABASE_URL")
    print("   - REACT_APP_SUPABASE_ANON_KEY")
    print("\n4. Ejecuta: sudo supervisorctl restart backend frontend")
    print("\n5. Consulta /app/INSTRUCCIONES_SETUP.md para más detalles")
    print("\n" + "="*80 + "\n")
    sys.exit(1)

try:
    # Cliente para operaciones de backend (con service role)
    supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Cliente para operaciones a nivel de usuario (con anon key)
    supabase_user: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    print("✓ Supabase conectado exitosamente")
except Exception as e:
    print(f"\n✗ Error al conectar con Supabase: {str(e)}")
    print("\nVerifica que tus credenciales sean correctas en /app/backend/.env")
    print("Consulta /app/INSTRUCCIONES_SETUP.md para ayuda\n")
    sys.exit(1)
