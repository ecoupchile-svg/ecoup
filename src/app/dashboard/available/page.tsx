'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RequestCard } from '@/components/requests/RequestCard';
import { useAvailableRequests } from '@/hooks/useRequests';
import { Button } from '@/components/ui/Button';
import { Map, RefreshCw } from 'lucide-react';

function AvailableList() {
  const { requests, loading, error, refresh } = useAvailableRequests();

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-stone-100" />)}
    </div>
  );
  if (error) return (
    <div className="text-center py-12 text-red-500">
      <p>{error}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={refresh}>Reintentar</Button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-display)' }}>Solicitudes disponibles</h1>
          <p className="text-stone-500 text-sm mt-1">{requests.length} solicitudes pendientes</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-xl hover:bg-stone-100 transition-colors"><RefreshCw size={16} className="text-stone-400" /></button>
      </div>
      {requests.length === 0 ? (
        <div className="text-center py-20">
          <Map size={48} className="text-stone-300 mx-auto mb-4" />
          <h3 className="font-semibold text-stone-600 text-lg">No hay solicitudes disponibles</h3>
          <p className="text-stone-400 text-sm mt-1">Vuelve más tarde para encontrar nuevas solicitudes</p>
          <Button variant="secondary" className="mt-4" onClick={refresh} icon={<RefreshCw size={14} />}>Actualizar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => <RequestCard key={r.id} request={r} href={`/dashboard/requests/${r.id}`} />)}
        </div>
      )}
    </div>
  );
}

export default function AvailablePage() {
  return <AuthGuard requiredRole="RECYCLER"><AvailableList /></AuthGuard>;
}
