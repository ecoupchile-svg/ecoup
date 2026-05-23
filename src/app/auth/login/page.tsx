'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { signIn } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { validateEmail } from '@/lib/validations';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Completa todos los campos');
    if (!validateEmail(email)) return toast.error('Ingresa un email válido');
    setLoading(true);
    try {
      await signIn(email, password);
      const nextPath = new URLSearchParams(window.location.search).get('next');
      router.push(nextPath || '/dashboard/requests');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0faf0] via-white to-[#faf7f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md" style={{ animation: 'fadeUp 0.5s ease-out forwards' }}>
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Ecoup" width={160} height={64} priority className="h-16 w-auto mx-auto mb-4" />
          <p className="text-stone-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
          <p className="text-center text-sm text-stone-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="text-green-700 font-semibold hover:underline">Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
