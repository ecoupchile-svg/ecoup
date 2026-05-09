import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { RequestCard } from '@/components/RequestCard';
import { Plus, Recycle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const HomePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'RECYCLER' ? '/requests/available' : '/requests';
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
          {user.role === 'RECYCLER' ? 'Solicitudes disponibles' : 'Mis solicitudes'}
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Hola, {user.nombre}
        </p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Recycle size={48} className="text-[#2BBFB3] animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Cargando solicitudes...</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Recycle size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {user.role === 'RECYCLER'
                ? 'No hay solicitudes disponibles'
                : 'Aún no tienes solicitudes'}
            </h3>
            <p className="text-sm text-gray-500">
              {user.role === 'RECYCLER'
                ? 'Las nuevas solicitudes aparecerán aquí'
                : 'Crea tu primera solicitud de reciclaje'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onClick={() => navigate(`/request/${request.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante (solo para usuarios hogar) */}
      {user.role === 'USER' && (
        <button
          data-testid="create-request-button"
          onClick={() => navigate('/create-request')}
          className="fixed bottom-20 right-6 w-16 h-16 bg-[#C8F135] rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 z-40"
        >
          <Plus size={32} className="text-gray-900" />
        </button>
      )}

      <BottomNav />
    </div>
  );
};
