import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { RequestStatus } from '@/types';

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: es });
}

export function formatRelative(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptado',
  IN_PROGRESS: 'En progreso',
  EVIDENCE_UPLOADED: 'Evidencia subida',
  COMPLETED: 'Completado',
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  EVIDENCE_UPLOADED: 'bg-orange-100 text-orange-800 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
};

export const WASTE_TYPES = [
  'Papel y cartón', 'Plástico', 'Vidrio', 'Metal', 'Electrónico',
  'Textiles', 'Orgánico', 'Baterías', 'Aceite', 'Mixto',
];

export function getStatusNext(status: RequestStatus): RequestStatus | null {
  const flow: Record<RequestStatus, RequestStatus | null> = {
    PENDING: 'ACCEPTED',
    ACCEPTED: 'IN_PROGRESS',
    IN_PROGRESS: 'EVIDENCE_UPLOADED',
    EVIDENCE_UPLOADED: 'COMPLETED',
    COMPLETED: null,
  };
  return flow[status];
}
