'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Recycle } from 'lucide-react';
import { signUp } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { validateEmail, validatePassword } from '@/lib/validations';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'RECYCLER'>('USER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error('Ingresa tu nombre');
    if (!validateEmail(email)) return toast.error('Ingresa un email válido');
    const pwErr = validatePassword(password);
    if (pwErr) return toast.error(pwErr);
    setLoading(true);
    try {
      await signUp(email, password, fullName, role);
      toast.success('¡Cuenta creada! Revisa tu email para confirmar');
      router.push('/auth/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0faf0] via-white to-[#faf7f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Ecoup" width={160} height={64} priority className="h-16 w-auto mx-auto mb-4" />
          <p className="text-stone-500 mt-1">Crea tu cuenta gratuita</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Nombre completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre" required className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" required className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" required minLength={6} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'USER', label: 'Usuario', desc: 'Creo solicitudes de reciclaje', Icon: User, isActive: role === 'USER', activeClass: 'border-green-500 bg-green-50', activeTextClass: 'text-green-800', activeIconClass: 'text-green-600' },
                  { value: 'RECYCLER', label: 'Reciclador', desc: 'Acepto solicitudes y reciclo', Icon: Recycle, isActive: role === 'RECYCLER', activeClass: 'border-amber-500 bg-amber-50', activeTextClass: 'text-amber-800', activeIconClass: 'text-amber-600' },
                ] as const).map(({ value, label, desc, Icon, isActive, activeClass, activeTextClass, activeIconClass }) => (
                  <button key={value} type="button" onClick={() => setRole(value as 'USER' | 'RECYCLER')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${isActive ? activeClass : 'border-stone-200 hover:border-stone-300'}`}>
                    <Icon size={18} className={isActive ? activeIconClass : 'text-stone-400'} />
                    <div className={`text-sm font-semibold mt-1 ${isActive ? activeTextClass : 'text-stone-600'}`}>{label}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
          <p className="text-center text-sm text-stone-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-green-700 font-semibold hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
