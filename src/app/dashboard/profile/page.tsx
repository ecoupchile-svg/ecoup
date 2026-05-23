'use client';
import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { signOut, createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Mail, Star, Recycle, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

function ProfileContent() {
  const { profile, session } = useAuth();
  const router = useRouter();
  const isRecycler = profile?.role === 'RECYCLER';
  const supabase = createClient();
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile?.phone) {
      setPhone(profile.phone);
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
    router.push('/auth/login');
  };

  const handleSavePhone = async () => {
  if (!phone) {
    toast.error('Ingresa un teléfono');
    return;
  }

  if (!profile?.id) {
    toast.error('Perfil no cargado');
    return;
  }

  const cleanPhone = phone.replace('+', '');

  const { error } = await supabase
    .from('profiles')
    .update({ phone: cleanPhone })
    .eq('id', profile.id);

  if (error) {
    console.error(error);
    toast.error('Error guardando teléfono');
  } else {
    toast.success('Teléfono actualizado');
  }
};

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-800 mb-6" style={{ fontFamily: 'var(--font-display)' }}>
        Mi perfil
      </h1>

      <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isRecycler ? 'bg-amber-100' : 'bg-green-100'}`}>
            {isRecycler ? <Recycle size={28} className="text-amber-700" /> : <User size={28} className="text-green-700" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">{profile?.full_name}</h2>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full mt-1 ${isRecycler ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {isRecycler ? <><Recycle size={11} />Reciclador</> : <><User size={11} />Usuario</>}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {/* EMAIL */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <Mail size={16} className="text-stone-400" />
            <div>
              <div className="text-xs text-stone-400">Email</div>
              <div className="text-sm text-stone-700">{session?.user?.email}</div>
            </div>
          </div>

          {/* TELÉFONO (solo recicladores) */}
          {isRecycler && (
            <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl">
              <div className="text-xs text-stone-400">Teléfono (para contacto por WhatsApp)</div>
              
              <input
                type="tel"
                placeholder="56912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-sm text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-2 outline-none"
              />

              <Button onClick={handleSavePhone}>
                Guardar teléfono
              </Button>
            </div>
          )}

          {/* RATING */}
          {profile?.rating_avg && profile.rating_avg > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <Star size={16} className="text-amber-400" />
              <div>
                <div className="text-xs text-stone-400">Calificación promedio</div>
                <div className="text-sm font-semibold text-stone-700">
                  {Number(profile.rating_avg).toFixed(1)} / 5 ({profile.rating_count} calificaciones)
                </div>
              </div>
            </div>
          )}

          {/* ID */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <Shield size={16} className="text-stone-400" />
            <div>
              <div className="text-xs text-stone-400">ID de usuario</div>
              <div className="text-xs font-mono text-stone-500">
                {profile?.id?.slice(0, 20)}...
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="danger"
        className="w-full"
        onClick={handleSignOut}
        icon={<LogOut size={16} />}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
