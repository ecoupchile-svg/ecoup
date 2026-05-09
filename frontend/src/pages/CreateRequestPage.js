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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState(null);

  const wasteTypes = ['Plastico', 'Carton', 'Vidrio', 'Metal', 'Organico', 'Electronico', 'Mixto'];

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalizacion');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        toast.success('Ubicacion obtenida');
        setGettingLocation(false);
      },
      () => {
        toast.error('No se pudo obtener la ubicacion');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !address.trim()) {
      toast.error('Titulo y direccion son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/requests`, {
        title,
        description: description.trim() || "",
        waste_type: wasteType || "",
        address,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Solicitud creada exitosamente!');
      navigate('/home');
    } catch (error) {
      console.error('Error creating request:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="bg-white border-b border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-2">
          <button data-testid="back-button" onClick={() => navigate('/home')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Nueva solicitud</h1>
        </div>
        <p className="text-sm font-medium text-gray-500">Completa los datos de tu solicitud de reciclaje</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Titulo</label>
            <input
              type="text" data-testid="input-title" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="Ej: Botellas PET para reciclar"
              className="w-full h-14 rounded-xl bg-gray-100 border-transparent px-4 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Tipo de residuo</label>
            <div className="flex flex-wrap gap-2">
              {wasteTypes.map((type) => (
                <button key={type} type="button" onClick={() => setWasteType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    wasteType === type ? 'bg-[#2BBFB3] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Direccion de recoleccion</label>
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-4 text-gray-400" />
              <input
                type="text" data-testid="input-address" value={address} onChange={(e) => setAddress(e.target.value)} required
                placeholder="Calle, numero, colonia..."
                className="w-full h-14 rounded-xl bg-gray-100 border-transparent pl-12 pr-4 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Descripcion (opcional)</label>
            <textarea
              data-testid="input-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Cantidad, instrucciones especiales..."
              className="w-full rounded-xl bg-gray-100 border-transparent px-4 py-3 text-base font-medium text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#2BBFB3] focus:ring-2 focus:ring-[#2BBFB3]/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Ubicacion GPS (opcional)</label>
            <button type="button" data-testid="get-location-button" onClick={getLocation} disabled={gettingLocation}
              className="w-full h-14 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-base flex items-center justify-center gap-3 active:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {gettingLocation ? (
                <><Loader2 size={20} className="animate-spin" /> Obteniendo ubicacion...</>
              ) : location ? (
                <><MapPin size={20} className="text-[#2BBFB3]" /> Ubicacion obtenida</>
              ) : (
                <><MapPin size={20} /> Obtener mi ubicacion</>
              )}
            </button>
          </div>

          <button type="submit" data-testid="submit-request-button" disabled={loading} className="btn-primary">
            {loading ? 'Creando solicitud...' : 'Crear solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
};
