'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Leaf } from 'lucide-react';
import type { UserRole } from '@/types';

export function AuthGuard({ children, requiredRole }: { children: React.ReactNode; requiredRole?: UserRole }) {
  const { isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) { router.push('/auth/login'); return; }
      if (requiredRole && profile?.role !== requiredRole) { router.push('/dashboard/requests'); }
    }
  }, [loading, isAuthenticated, profile, requiredRole, router]);

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Leaf size={32} className="text-forest-600 animate-pulse-soft" />
        <Loader2 size={24} className="animate-spin text-forest-400" />
      </div>
    </div>
  );
  if (!isAuthenticated) return null;
  if (requiredRole && profile?.role !== requiredRole) return null;
  return <>{children}</>;
}
