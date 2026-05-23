'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LocationPicker } from '@/components/map/LocationPicker';
import { Button } from '@/components/ui/Button';
import { createRequest } from '@/lib/supabase';
import { WASTE_TYPES } from '@/lib/helpers';
import { validateRequestForm } from '@/lib/validations';
import { MapPin, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function NewRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', waste_type: '', address: '', estimated_weight: '', scheduled_at: '' });
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateRequestForm(form);
    if (!lat || !lng) errs.map = 'Selecciona la ubicación en el mapa';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const req = await createRequest({
        title: form.title, description: form.description, waste_type: form.waste_type, address: form.address,
        latitude: lat!, longitude: lng!,
        estimated_weight: form.estimated_weight ? parseFloat(form.estimated_weight) : undefined,
        scheduled_at: form.scheduled_at || undefined,
      });
      toast.success('¡Solicitud creada!');
      router.push(`/dashboard/requests/${req.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear solicitud');
    } finally { setLoading(false); }
  };

  const inp = (field: string) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition ${errors[field] ? 'border-red-300 bg-red-50' : 'border-stone-200'}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/requests">
          <button className="p-2 rounded-xl hover:bg-stone-100"><ArrowLeft size={18} className="text-stone-600" /></button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-display)' }}>Nueva solicitud</h1>
          <p className="text-stone-500 text-sm">Crea una solicitud de reciclaje</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700 text-xs uppercase tracking-widest">Información básica</h2>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Título *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Reciclaje de cartones" className={inp('title')} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Descripción *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe qué tienes para reciclar..." rows={3} className={`${inp('description')} resize-none`} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Tipo de residuo *</label>
              <select value={form.waste_type} onChange={e => set('waste_type', e.target.value)} className={inp('waste_type')}>
                <option value="">Seleccionar...</option>
                {WASTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.waste_type && <p className="text-red-500 text-xs mt-1">{errors.waste_type}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Peso aprox. (kg)</label>
              <input type="number" min="0" step="0.1" value={form.estimated_weight} onChange={e => set('estimated_weight', e.target.value)} placeholder="Opcional" className={inp('estimated_weight')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Fecha preferida</label>
            <input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} className={inp('scheduled_at')} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700 text-xs uppercase tracking-widest flex items-center gap-2"><MapPin size={14} />Ubicación</h2>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Dirección *</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ej: Av. Providencia 1234, Santiago" className={inp('address')} />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div>
            <p className="text-sm text-stone-500 mb-2">Haz clic en el mapa para marcar la ubicación exacta</p>
            <LocationPicker lat={lat} lng={lng} onSelect={(la, lo) => { setLat(la); setLng(lo); }} />
            {lat && lng && <p className="text-xs text-green-700 mt-1.5 flex items-center gap-1"><MapPin size={11} />{lat.toFixed(5)}, {lng.toFixed(5)}</p>}
            {errors.map && <p className="text-red-500 text-xs mt-1">{errors.map}</p>}
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={<Send size={16} />}>Publicar solicitud</Button>
      </form>
    </div>
  );
}

export default function NewRequestPage() {
  return <AuthGuard requiredRole="USER"><NewRequestForm /></AuthGuard>;
}
