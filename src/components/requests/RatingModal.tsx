'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { submitRating } from '@/lib/supabase';
import toast from 'react-hot-toast';

export function RatingModal({ isOpen, onClose, requestId, ratedId, ratedName, onSuccess }: {
  isOpen: boolean; onClose: () => void; requestId: string;
  ratedId: string; ratedName: string; onSuccess: () => void;
}) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!score) return toast.error('Selecciona una calificación');
    setLoading(true);
    try {
      await submitRating(requestId, ratedId, score, comment || undefined);
      toast.success('¡Calificación enviada!');
      onSuccess();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al calificar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Calificar a ${ratedName}`}>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-stone-500 mb-3 text-center">¿Cómo fue el servicio de reciclaje?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setScore(n)}
                className="transition-transform hover:scale-110 active:scale-95">
                <Star size={36} className={`${n <= (hover || score) ? 'text-amber-400 fill-amber-400' : 'text-stone-200'} transition-colors`} />
              </button>
            ))}
          </div>
          {score > 0 && (
            <p className="text-center text-sm font-medium text-stone-600 mt-2">
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][score]}
            </p>
          )}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Comentario opcional..." rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest-400" />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSubmit} loading={loading} disabled={!score}>
            Enviar calificación
          </Button>
        </div>
      </div>
    </Modal>
  );
}
