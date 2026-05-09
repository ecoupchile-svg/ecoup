import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const RequestCard = ({ request, onClick, showUser = false }) => {
  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Pendiente',
      'ACCEPTED': 'Aceptada',
      'IN_PROGRESS': 'En progreso',
      'EVIDENCE_UPLOADED': 'Evidencia subida',
      'COMPLETED': 'Completada'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'PENDING': 'status-pending',
      'ACCEPTED': 'status-accepted',
      'IN_PROGRESS': 'status-in-progress',
      'EVIDENCE_UPLOADED': 'status-evidence-uploaded',
      'COMPLETED': 'status-completed'
    };
    return statusClasses[status] || 'status-pending';
  };

  return (
    <div
      data-testid="request-card"
      onClick={onClick}
      className="card card-interactive cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-gray-500" />
            <p className="text-base font-semibold text-gray-900">
              {request.direccion}
            </p>
          </div>
          {request.descripcion && (
            <p className="text-sm text-gray-500 ml-6">
              {request.descripcion}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />
          <span>
            {format(new Date(request.created_at), "d 'de' MMM, HH:mm", { locale: es })}
          </span>
        </div>
        <div className={`status-badge ${getStatusClass(request.status)}`}>
          {getStatusText(request.status)}
        </div>
      </div>
    </div>
  );
};
