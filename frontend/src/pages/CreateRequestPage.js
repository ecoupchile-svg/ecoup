import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CreateRequestPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success('Ubicación obtenida');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('No se pudo obtener la ubicación');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!direccion.trim()) {
      toast.error('Por favor ingresa una dirección');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        direccion,
        descripcion: descripcion.trim() || null,
        lat: location?.lat || null,
        lng: location?.lng || null
      };

      await axios.post(`${API}/requests`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('¡Solicitud creada exitosamente!');
      navigate('/home');
    } catch (error) {
      toast.error('Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            data-testid="back-button"
            onClick={() => navigate('/home')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Nueva solicitud
          </h1>
        </div>
        <p className="text-sm font-medium text-gray-500">
          Completa los datos de tu solicitud de reciclaje
        </p>
      </div>

      {/* Formulario */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Dirección de recolección
            </label>
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-4 text-gray-400" />
              <input
                type="text"
                data-testid="input-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
                placeholder="Calle, número, colonia..."
                className="w-full h-14 rounded-xl bg-gray-100 border-transparent pl-12 pr-4 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Descripción (opcional)
            </label>
            <textarea
              data-testid="input-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              placeholder="Tipo de materiales, cantidad aproximada, instrucciones especiales..."
              className="w-full rounded-xl bg-gray-100 border-transparent px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Ubicación GPS (opcional)
            </label>
            <button
              type="button"
              data-testid="get-location-button"
              onClick={getLocation}
              disabled={gettingLocation}
              className="w-full h-14 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-lg flex items-center justify-center gap-3 active:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {gettingLocation ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : location ? (
                <>
                  <MapPin size={20} className="text-[#2BBFB3]" />
                  Ubicación obtenida ✓
                </>
              ) : (
                <>
                  <MapPin size={20} />
                  Obtener mi ubicación
                </>
              )}
            </button>
            {location && (
              <p className="text-sm text-gray-500 mt-2">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
            )}
          </div>

          <button
            type="submit"
            data-testid="submit-request-button"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creando solicitud...' : 'Crear solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
};
