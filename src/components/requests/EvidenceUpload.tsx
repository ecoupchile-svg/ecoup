'use client';
import { useState, useRef } from 'react';
import { Camera, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGeolocation } from '@/hooks/useGeolocation';
import { uploadEvidence } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { Evidence } from '@/types';

const MAX_EVIDENCE_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function EvidenceUpload({ requestId, onSuccess }: { requestId: string; onSuccess: (e: Evidence) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const { coords, loading: geoLoading, getCurrentPosition } = useGeolocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_EVIDENCE_TYPES.includes(f.type)) {
      toast.error('Sube una imagen JPG, PNG o WebP');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_EVIDENCE_FILE_SIZE) {
      toast.error('La imagen no puede superar 5 MB');
      e.target.value = '';
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) return toast.error('Selecciona una imagen');
    if (!coords) return toast.error('Captura tu ubicación GPS primero');
    setUploading(true);
    try {
      const evidence = await uploadEvidence(requestId, file, coords.lat, coords.lng, notes || undefined);
      toast.success('Evidencia subida correctamente');
      onSuccess(evidence);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al subir evidencia');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button onClick={() => { setFile(null); setPreview(null); }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-lg px-2 py-1 text-xs">
            Cambiar
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="w-full h-40 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-500 hover:border-forest-400 hover:text-forest-600 hover:bg-forest-50 transition-all">
          <Camera size={32} />
          <span className="font-medium">Tomar / Subir foto</span>
          <span className="text-xs">Evidencia del reciclaje</span>
        </button>
      )}

      <div className={`flex items-center gap-3 p-3 rounded-xl border ${coords ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-stone-200'}`}>
        {coords ? (
          <>
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <div className="text-xs text-green-700">
              <div className="font-semibold">GPS capturado</div>
              <div>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
            </div>
          </>
        ) : (
          <>
            <MapPin size={18} className="text-stone-400 flex-shrink-0" />
            <span className="text-sm text-stone-500 flex-1">Ubicación GPS no capturada</span>
            <Button size="sm" variant="secondary" onClick={getCurrentPosition} loading={geoLoading} icon={<MapPin size={14} />}>
              Capturar
            </Button>
          </>
        )}
      </div>

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales (opcional)..."
        rows={2} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest-400" />

      <Button className="w-full" onClick={handleSubmit} loading={uploading}
        disabled={!file || !coords} icon={uploading ? undefined : <CheckCircle size={16} />}>
        Subir Evidencia
      </Button>
    </div>
  );
}
