import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Loader2, Upload } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

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
    if (!navigator.geolocation) { toast.error('Tu navegador no soporta geolocalizacion'); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Ubicacion obtenida');
        setGettingLocation(false);
      },
      () => { toast.error('No se pudo obtener la ubicacion'); setGettingLocation(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) { toast.error('Toma una foto primero'); return; }
    if (!location) { toast.error('Obtiene tu ubicacion primero'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', photo);
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);

      await axios.post(`${API}/evidence/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Evidencia subida exitosamente!');
      navigate(`/request/${id}`);
    } catch { toast.error('Error al subir la evidencia'); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-container">
      <div className="bg-white border-b border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-2">
          <button data-testid="back-button" onClick={() => navigate(`/request/${id}`)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Subir evidencia</h1>
        </div>
        <p className="text-sm font-medium text-gray-500">Toma una foto y registra tu ubicacion</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3">Foto de evidencia</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} data-testid="photo-input" className="hidden" id="photo-input" />
            <label htmlFor="photo-input"
              className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#2BBFB3] hover:bg-[#2BBFB3]/5 transition-all overflow-hidden"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <><Camera size={48} className="mb-2" /><span className="text-base font-medium">Tomar foto</span></>
              )}
            </label>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-3">Ubicacion GPS</label>
            <button type="button" data-testid="get-location-button" onClick={getLocation} disabled={gettingLocation}
              className="w-full h-14 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-base flex items-center justify-center gap-3 active:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {gettingLocation ? (<><Loader2 size={20} className="animate-spin" /> Obteniendo...</>)
                : location ? (<><MapPin size={20} className="text-[#2BBFB3]" /> Ubicacion obtenida</>)
                : (<><MapPin size={20} /> Obtener ubicacion actual</>)}
            </button>
            {location && <p className="text-sm text-gray-500 mt-2">Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800"><strong>Importante:</strong> La foto y ubicacion serviran como evidencia de la recoleccion.</p>
          </div>

          <button type="submit" data-testid="submit-evidence-button" disabled={loading || !photo || !location}
            className="btn-primary flex items-center justify-center gap-2">
            {loading ? (<><Loader2 size={20} className="animate-spin" /> Subiendo...</>) : (<><Upload size={20} /> Subir evidencia</>)}
          </button>
        </form>
      </div>
    </div>
  );
};
