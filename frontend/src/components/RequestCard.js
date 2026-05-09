import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const RequestCard = ({ request, onClick }) => {
  const getStatusText = (status) => {
    const map = {
      'PENDING': 'Pendiente',
      'ACCEPTED': 'Aceptada',
      'IN_PROGRESS': 'En progreso',
      'EVIDENCE_UPLOADED': 'Evidencia subida',
      'COMPLETED': 'Completada'
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      'PENDING': 'status-pending',
      'ACCEPTED': 'status-accepted',
      'IN_PROGRESS': 'status-in-progress',
      'EVIDENCE_UPLOADED': 'status-evidence-uploaded',
      'COMPLETED': 'status-completed'
    };
    return map[status] || 'status-pending';
  };

  return (
    <div data-testid="request-card" onClick={onClick} className="card card-interactive cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-base font-bold text-gray-900 mb-1">{request.title}</p>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <p className="text-sm text-gray-500">{request.address}</p>
          </div>
          {request.waste_type && (
            <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-[#2BBFB3]/10 text-[#2BBFB3] text-xs font-bold">
              {request.waste_type}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />
          <span>
            {request.created_at ? format(new Date(request.created_at), "d 'de' MMM, HH:mm", { locale: es }) : ''}
          </span>
        </div>
        <div className={`status-badge ${getStatusClass(request.status)}`}>
          {getStatusText(request.status)}
        </div>
      </div>
    </div>
  );
};
