import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { MapView } from '@/components/MapView';
import { RatingStars } from '@/components/RatingStars';
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const RequestDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');

  useEffect(() => { loadRequestDetail(); }, [id]);

  const loadRequestDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequest(res.data);

      if (['EVIDENCE_UPLOADED', 'COMPLETED'].includes(res.data.status)) {
        const evRes = await axios.get(`${API}/evidence/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvidence(evRes.data);
      }
    } catch {
      toast.error('Error al cargar la solicitud');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/requests/${id}`, { status: 'ACCEPTED', recycler_id: user.id },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Solicitud aceptada');
      loadRequestDetail();
    } catch { toast.error('Error al aceptar'); }
    finally { setActionLoading(false); }
  };

  const handleStartProgress = async () => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/requests/${id}`, { status: 'IN_PROGRESS' },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Recoleccion iniciada');
      loadRequestDetail();
    } catch { toast.error('Error'); }
    finally { setActionLoading(false); }
  };

  const handleConfirmEvidence = () => setShowRatingModal(true);

  const handleReportProblem = async () => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/requests/${id}`, { status: 'IN_PROGRESS' },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Problema reportado. El reciclador sera notificado.');
      loadRequestDetail();
    } catch { toast.error('Error al reportar'); }
    finally { setActionLoading(false); }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) { toast.error('Selecciona una calificacion'); return; }
    setActionLoading(true);
    try {
      await axios.post(`${API}/ratings`, {
        request_id: id, recycler_id: request.recycler_id, rating,
        comentario: comentario.trim() || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Gracias por tu calificacion!');
      navigate('/home');
    } catch { toast.error('Error al enviar calificacion'); }
    finally { setActionLoading(false); }
  };

  const getStatusText = (s) => ({ 'PENDING':'Pendiente','ACCEPTED':'Aceptada','IN_PROGRESS':'En progreso','EVIDENCE_UPLOADED':'Evidencia subida','COMPLETED':'Completada' }[s] || s);
  const getStatusClass = (s) => ({ 'PENDING':'status-pending','ACCEPTED':'status-accepted','IN_PROGRESS':'status-in-progress','EVIDENCE_UPLOADED':'status-evidence-uploaded','COMPLETED':'status-completed' }[s] || 'status-pending');

  if (loading) return <div className="app-container flex items-center justify-center"><Loader2 size={48} className="text-[#2BBFB3] animate-spin" /></div>;
  if (!request) return null;

  const isRecycler = user?.role === 'RECYCLER';
  const isOwner = request.user_id === user?.id;

  return (
    <div className="app-container">
      <div className="bg-white border-b border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <button data-testid="back-button" onClick={() => navigate('/home')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Detalle</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-8">
        {/* Estado */}
        <div className="card flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Estado</span>
          <div className={`status-badge ${getStatusClass(request.status)}`}>{getStatusText(request.status)}</div>
        </div>

        {/* Info */}
        <div className="card space-y-3">
          <h2 className="text-lg font-bold text-gray-900">{request.title}</h2>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{request.address}</span>
          </div>
          {request.description && <p className="text-sm text-gray-500">{request.description}</p>}
          {request.waste_type && (
            <span className="inline-block px-3 py-1 rounded-lg bg-[#2BBFB3]/10 text-[#2BBFB3] text-xs font-bold">{request.waste_type}</span>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50">
            <Clock size={14} />
            <span>{request.created_at ? format(new Date(request.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es }) : ''}</span>
          </div>
        </div>

        {/* Mapa */}
        {request.latitude && request.longitude && (
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-3">Ubicacion</h3>
            <div className="h-[250px]">
              <MapView lat={request.latitude} lng={request.longitude} markers={[{ lat: request.latitude, lng: request.longitude, popup: request.address }]} />
            </div>
          </div>
        )}

        {/* Evidencia */}
        {evidence.length > 0 && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-gray-900">Evidencia</h3>
            {evidence.map((ev) => (
              <div key={ev.id} className="space-y-3">
                <img src={ev.image_url} alt="Evidencia" className="w-full rounded-xl" data-testid="evidence-photo" />
                {ev.latitude && ev.longitude && (
                  <div className="h-[180px]">
                    <MapView lat={ev.latitude} lng={ev.longitude} markers={[{ lat: ev.latitude, lng: ev.longitude, popup: 'Ubicacion de evidencia' }]} />
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  {ev.created_at ? format(new Date(ev.created_at), "d 'de' MMM, HH:mm", { locale: es }) : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Acciones reciclador */}
        {isRecycler && (
          <div className="space-y-3">
            {request.status === 'PENDING' && (
              <button data-testid="accept-request-button" onClick={handleAccept} disabled={actionLoading} className="btn-secondary">
                {actionLoading ? 'Procesando...' : 'Aceptar solicitud'}
              </button>
            )}
            {request.status === 'ACCEPTED' && request.recycler_id === user.id && (
              <button data-testid="start-progress-button" onClick={handleStartProgress} disabled={actionLoading} className="btn-secondary">
                {actionLoading ? 'Procesando...' : 'Iniciar recoleccion'}
              </button>
            )}
            {request.status === 'IN_PROGRESS' && request.recycler_id === user.id && (
              <button data-testid="upload-evidence-button" onClick={() => navigate(`/upload-evidence/${id}`)} className="btn-secondary flex items-center justify-center gap-2">
                <Camera size={20} /> Subir evidencia
              </button>
            )}
          </div>
        )}

        {/* Acciones usuario hogar */}
        {isOwner && request.status === 'EVIDENCE_UPLOADED' && (
          <div className="space-y-3">
            <button data-testid="confirm-evidence-button" onClick={handleConfirmEvidence} disabled={actionLoading}
              className="btn-primary flex items-center justify-center gap-2">
              <CheckCircle size={20} /> Confirmar recoleccion
            </button>
            <button data-testid="report-problem-button" onClick={handleReportProblem} disabled={actionLoading}
              className="w-full h-14 rounded-2xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-lg flex items-center justify-center gap-2 active:bg-gray-50">
              <AlertCircle size={20} /> Reportar problema
            </button>
          </div>
        )}
      </div>

      {/* Rating modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 slide-up">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Califica el servicio</h3>
            <p className="text-sm text-gray-500 mb-6">Tu opinion ayuda a mejorar la comunidad</p>
            <div className="flex justify-center mb-6">
              <RatingStars value={rating} onChange={setRating} />
            </div>
            <textarea data-testid="input-comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3}
              placeholder="Comentario opcional..." className="w-full rounded-xl bg-gray-100 border-transparent px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all resize-none mb-4" />
            <div className="space-y-3">
              <button data-testid="submit-rating-button" onClick={handleSubmitRating} disabled={actionLoading} className="btn-primary">
                {actionLoading ? 'Enviando...' : 'Enviar calificacion'}
              </button>
              <button data-testid="cancel-rating-button" onClick={() => setShowRatingModal(false)} disabled={actionLoading}
                className="w-full h-14 rounded-2xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-lg flex items-center justify-center active:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
