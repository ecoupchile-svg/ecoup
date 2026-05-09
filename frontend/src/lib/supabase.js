import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Validar que las credenciales estén configuradas
if (!supabaseUrl || supabaseUrl === 'TU_SUPABASE_URL_AQUI' || 
    !supabaseAnonKey || supabaseAnonKey === 'TU_SUPABASE_ANON_KEY_AQUI') {
  console.error('⚠️  CONFIGURACIÓN REQUERIDA: Supabase no está configurado');
  console.error('Por favor sigue las instrucciones en /app/INSTRUCCIONES_SETUP.md');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
