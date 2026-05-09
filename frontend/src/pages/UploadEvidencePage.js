import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Loader2, Upload, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const UploadEvidencePage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Intentar obtener GPS automaticamente al cargar
  useEffect(() => {
    getLocation();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(true);
      setShowManual(true);
      return;
    }
    setGettingLocation(true);
    setGpsError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Ubicacion GPS obtenida');
        setGettingLocation(false);
        setGpsError(false);
        setShowManual(false);
      },
      (error) => {
        console.error('GPS error:', error.code, error.message);
        setGettingLocation(false);
        setGpsError(true);
        setShowManual(true);

        if (error.code === 1) {
          toast.error('Permiso de ubicacion denegado. Ingresa las coordenadas manualmente.');
        } else if (error.code === 2) {
          toast.error('Ubicacion no disponible. Ingresa las coordenadas manualmente.');
        } else {
          toast.error('No se pudo obtener la ubicacion. Ingresa las coordenadas manualmente.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const getEffectiveLocation = () => {
    if (location) return location;
    if (manualLat && manualLng) {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) { toast.error('Selecciona una foto primero'); return; }

    const effectiveLocation = getEffectiveLocation();
    const lat = effectiveLocation?.lat || 0;
    const lng = effectiveLocation?.lng || 0;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', photo);
      formData.append('lat', lat);
      formData.append('lng', lng);

      await axios.post(`${API}/evidence/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Evidencia subida exitosamente!');
      navigate(`/request/${id}`);
    } catch (error) {
      console.error('Upload error:', error.response?.data);
      toast.error('Error al subir la evidencia');
    } finally {
      setLoading(false);
    }
  };

  const hasLocation = location || (manualLat && manualLng);

  return (
    <div className="app-container">
      <div className="bg-white border-b border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-2">
          <button data-testid="back-button" onClick={() => navigate(`/request/${id}`)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Subir evidencia</h1>
        </div>
        <p className="text-sm font-medium text-gray-500">Toma una foto para registrar la recoleccion</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3">Foto de evidencia</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} data-testid="photo-input" className="hidden" id="photo-input" />
            <label htmlFor="photo-input"
              className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#2BBFB3] hover:bg-[#2BBFB3]/5 transition-all overflow-hidden"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <><Camera size={48} className="mb-2" /><span className="text-base font-medium">Tomar foto o seleccionar</span></>
              )}
            </label>
          </div>

          {/* GPS */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3">Ubicacion GPS (opcional)</label>
            <button type="button" data-testid="get-location-button" onClick={getLocation} disabled={gettingLocation}
              className="w-full h-14 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-base flex items-center justify-center gap-3 active:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {gettingLocation ? (<><Loader2 size={20} className="animate-spin" /> Obteniendo ubicacion...</>)
                : location ? (<><MapPin size={20} className="text-[#2BBFB3]" /> Ubicacion obtenida</>)
                : (<><MapPin size={20} /> Intentar obtener ubicacion</>)}
            </button>
            {location && <p className="text-sm text-gray-500 mt-2">Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}</p>}

            {/* Error de GPS y entrada manual */}
            {gpsError && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">GPS no disponible</span>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  Puedes continuar sin ubicacion o ingresar coordenadas manualmente.
                </p>
                {showManual && (
                  <div className="space-y-2">
                    <button type="button" onClick={() => setShowManual(!showManual)} className="text-xs font-bold text-[#2BBFB3] underline">
                      {manualLat ? 'Ocultar coordenadas' : 'Ingresar coordenadas manualmente'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number" step="any" data-testid="manual-lat" value={manualLat} onChange={(e) => setManualLat(e.target.value)}
                        placeholder="Latitud" className="h-12 rounded-xl bg-white border border-gray-200 px-3 text-sm font-medium text-gray-900 placeholder-gray-400"
                      />
                      <input
                        type="number" step="any" data-testid="manual-lng" value={manualLng} onChange={(e) => setManualLng(e.target.value)}
                        placeholder="Longitud" className="h-12 rounded-xl bg-white border border-gray-200 px-3 text-sm font-medium text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> La foto es obligatoria. La ubicacion GPS es opcional pero recomendada.
            </p>
          </div>

          <button type="submit" data-testid="submit-evidence-button" disabled={loading || !photo}
            className="btn-primary flex items-center justify-center gap-2">
            {loading ? (<><Loader2 size={20} className="animate-spin" /> Subiendo...</>) : (<><Upload size={20} /> Subir evidencia</>)}
          </button>
        </form>
      </div>
    </div>
  );
};
