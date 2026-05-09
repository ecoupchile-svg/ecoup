import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { RequestCard } from '@/components/RequestCard';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const HistoryPage = () => {
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
      // Filtrar solo las completadas
      const completed = response.data.filter(r => r.status === 'COMPLETED');
      setRequests(completed);
    } catch (error) {
      toast.error('Error al cargar el historial');
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
          Historial
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Solicitudes completadas
        </p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <HistoryIcon size={48} className="text-[#2BBFB3] animate-pulse mx-auto mb-4" />
              <p className="text-gray-500">Cargando historial...</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <HistoryIcon size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No hay solicitudes completadas
            </h3>
            <p className="text-sm text-gray-500">
              Las solicitudes completadas aparecerán aquí
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

      <BottomNav />
    </div>
  );
};
