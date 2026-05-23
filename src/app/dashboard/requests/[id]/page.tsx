'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EvidenceUpload } from '@/components/requests/EvidenceUpload';
import { RatingModal } from '@/components/requests/RatingModal';
import { useAuth } from '@/hooks/useAuth';
import { getRequestById, acceptRequest, updateRequestStatus } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';
import type { RecycleRequest, Evidence } from '@/types';
import { ArrowLeft, MapPin, User, Star, CheckCircle, Loader2, Camera, Play, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import toast from 'react-hot-toast';

const EvidenceMap = dynamic(() => import('@/components/map/EvidenceMapInner'), { ssr: false });

function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [request, setRequest] = useState<RecycleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);

  const isRecycler = profile?.role === 'RECYCLER';
  const isOwner = request?.user_id === profile?.id;
  const isAssignedRecycler = request?.recycler_id === profile?.id;

  const load = async () => {
    setLoading(true);
    const r = await getRequestById(id);
    setRequest(r);
    if (r?.evidence) {
      const ev = Array.isArray(r.evidence) ? r.evidence[0] : r.evidence;
      setEvidence(ev || null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async () => {
    setActionLoading(true);
    try { await acceptRequest(id); toast.success('Solicitud aceptada'); await load(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error'); }
    finally { setActionLoading(false); }
  };

  const handleStartProgress = async () => {
    setActionLoading(true);
    try { await updateRequestStatus(id, 'IN_PROGRESS'); toast.success('Solicitud en progreso'); await load(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-green-600" />
    </div>
  );

  if (!request) return (
    <div className="text-center py-20">
      <p className="text-stone-500">Solicitud no encontrada</p>
      <Link href="/dashboard/requests"><Button variant="secondary" className="mt-4">Volver</Button></Link>
    </div>
  );

  const rating = Array.isArray(request.rating) ? request.rating[0] : request.rating;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/requests">
          <button className="p-2 rounded-xl hover:bg-stone-100"><ArrowLeft size={18} className="text-stone-600" /></button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={request.status} />
            <span className="text-xs text-stone-400">{formatDate(request.created_at)}</span>
          </div>
          <h1 className="text-xl font-bold text-stone-800 mt-1 truncate" style={{ fontFamily: 'var(--font-display)' }}>{request.title}</h1>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-stone-100"><RefreshCw size={16} className="text-stone-400" /></button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <p className="text-stone-600 text-sm leading-relaxed">{request.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-stone-50 rounded-xl p-3">
              <div className="text-xs text-stone-400 mb-1">Tipo</div>
              <div className="font-medium text-stone-700">{request.waste_type}</div>
            </div>
            {request.estimated_weight && (
              <div className="bg-stone-50 rounded-xl p-3">
                <div className="text-xs text-stone-400 mb-1">Peso aprox.</div>
                <div className="font-medium text-stone-700">{request.estimated_weight} kg</div>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm text-stone-500">
            <MapPin size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <span>{request.address}</span>
          </div>
          {request.scheduled_at && (
            <p className="text-xs text-stone-400 mt-2">Fecha preferida: {new Date(request.scheduled_at).toLocaleString('es')}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">Participantes</h2>
          <div className="space-y-2">
            {request.user_profile && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-green-700" />
                </div>
                <div>
                  <div className="text-sm font-medium text-stone-700">{request.user_profile.full_name}</div>
                  <div className="text-xs text-stone-400">Solicitante</div>
                </div>
              </div>
            )}
            {request.recycler_profile && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-amber-700" />
                </div>
                <div>
                  <div className="text-sm font-medium text-stone-700">{request.recycler_profile.full_name}</div>
                  <div className="text-xs text-stone-400">Reciclador asignado</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {evidence && (
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Camera size={14} />Evidencia</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={evidence.image_url} alt="Evidencia" className="w-full h-48 object-cover rounded-xl mb-3" />
            <EvidenceMap lat={evidence.latitude} lng={evidence.longitude} label="Ubicación de reciclaje" />
            {evidence.notes && <p className="text-sm text-stone-500 mt-3 bg-stone-50 rounded-xl p-3">{evidence.notes}</p>}
          </div>
        )}

        {rating && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Star size={14} />Calificación</h2>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={20} className={n <= rating.score ? 'text-amber-400 fill-amber-400' : 'text-stone-200'} />
              ))}
              <span className="text-sm font-semibold text-stone-700 ml-1">{rating.score}/5</span>
            </div>
            {rating.comment && <p className="text-sm text-stone-600 mt-2">{rating.comment}</p>}
          </div>
        )}

        <div className="space-y-3">
          {isRecycler && request.status === 'PENDING' && (
            <Button className="w-full" size="lg" onClick={handleAccept} loading={actionLoading} icon={<CheckCircle size={16} />}>
              Aceptar solicitud
            </Button>
          )}
          {isAssignedRecycler && request.status === 'ACCEPTED' && (
            <Button className="w-full" size="lg" onClick={handleStartProgress} loading={actionLoading} icon={<Play size={16} />}>
              Iniciar reciclaje
            </Button>
          )}
          {isAssignedRecycler && request.status === 'IN_PROGRESS' && !showEvidenceUpload && (
            <Button className="w-full" size="lg" onClick={() => setShowEvidenceUpload(true)} icon={<Camera size={16} />}>
              Subir evidencia
            </Button>
          )}
          {isAssignedRecycler && request.status === 'IN_PROGRESS' && showEvidenceUpload && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <h2 className="font-semibold text-stone-700 mb-4">Subir evidencia de reciclaje</h2>
              <EvidenceUpload requestId={id} onSuccess={async (e) => { setEvidence(e); setShowEvidenceUpload(false); await load(); }} />
              <button onClick={() => setShowEvidenceUpload(false)} className="mt-3 text-sm text-stone-400 hover:text-stone-600 w-full text-center">Cancelar</button>
            </div>
          )}
          {isOwner && request.status === 'EVIDENCE_UPLOADED' && !rating && request.recycler_id && (
            <Button className="w-full" size="lg" onClick={() => setShowRating(true)} icon={<Star size={16} />}>
              Calificar reciclador
            </Button>
          )}
        </div>
      </div>

      {request.recycler_id && (
        <RatingModal isOpen={showRating} onClose={() => setShowRating(false)}
          requestId={id} ratedId={request.recycler_id}
          ratedName={request.recycler_profile?.full_name || 'Reciclador'}
          onSuccess={() => { setShowRating(false); load(); }} />
      )}
    </div>
  );
}

export default function RequestDetailPage() {
  return <AuthGuard><RequestDetail /></AuthGuard>;
}
