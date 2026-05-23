'use client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRequests, useRecyclerRequests } from '@/hooks/useRequests';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RequestCard } from '@/components/requests/RequestCard';
import { Button } from '@/components/ui/Button';
import { PlusCircle, Inbox, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function RequestsList() {
  const { profile } = useAuth();
  const isRecycler = profile?.role === 'RECYCLER';
  const user = useUserRequests();
  const recycler = useRecyclerRequests();
  const { requests, loading, error, refresh } = isRecycler ? recycler : user;

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-stone-100" />)}
    </div>
  );
  if (error) return (
    <div className="text-center py-12 text-red-500">
      <p className="font-medium">{error}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={refresh} icon={<RefreshCw size={14} />}>Reintentar</Button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-display)' }}>
            {isRecycler ? 'Mis reciclajes' : 'Mis solicitudes'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">{requests.length} {requests.length === 1 ? 'solicitud' : 'solicitudes'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"><RefreshCw size={16} /></button>
          {!isRecycler && (
            <Link href="/dashboard/requests/new">
              <Button icon={<PlusCircle size={16} />}>Nueva</Button>
            </Link>
          )}
        </div>
      </div>
      {requests.length === 0 ? (
        <div className="text-center py-16">
          <Inbox size={48} className="text-stone-300 mx-auto mb-4" />
          <h3 className="font-semibold text-stone-600 text-lg">{isRecycler ? 'Aún no has aceptado solicitudes' : 'Aún no tienes solicitudes'}</h3>
          <p className="text-stone-400 text-sm mt-1">{isRecycler ? 'Ve a "Disponibles" para encontrar solicitudes' : 'Crea tu primera solicitud de reciclaje'}</p>
          {!isRecycler && (
            <Link href="/dashboard/requests/new">
              <Button className="mt-4" icon={<PlusCircle size={16} />}>Crear solicitud</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => <RequestCard key={r.id} request={r} href={`/dashboard/requests/${r.id}`} />)}
        </div>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return <AuthGuard><RequestsList /></AuthGuard>;
}
