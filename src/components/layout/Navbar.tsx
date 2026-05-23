'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Map, User, LogOut, Recycle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';

export function Navbar() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
    router.push('/auth/login');
  };

  const isRecycler = profile?.role === 'RECYCLER';
  const links = [
    { href: '/dashboard/requests', label: 'Mis solicitudes', icon: LayoutDashboard },
    ...(isRecycler ? [{ href: '/dashboard/available', label: 'Disponibles', icon: Map }] : []),
    ...(!isRecycler ? [{ href: '/dashboard/requests/new', label: 'Nueva solicitud', icon: PlusCircle }] : []),
    { href: '/dashboard/profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard/requests" className="flex items-center">
            <Image src="/logo.png" alt="Ecoup" width={80} height={32} className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === href ? 'bg-forest-50 text-forest-700' : 'text-stone-600 hover:text-forest-700 hover:bg-stone-50')}>
                <Icon size={16} />{label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', isRecycler ? 'bg-earth-500' : 'bg-forest-500')} />
              <span className="text-xs text-stone-500">{profile?.full_name}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', isRecycler ? 'bg-earth-100 text-earth-700' : 'bg-forest-100 text-forest-700')}>
                {isRecycler ? <span className="flex items-center gap-1"><Recycle size={10} />Reciclador</span> : 'Usuario'}
              </span>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                pathname === href ? 'bg-forest-50 text-forest-700' : 'text-stone-500 hover:text-forest-600')}>
              <Icon size={14} />{label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
