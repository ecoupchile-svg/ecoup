'use client';
import Link from 'next/link';
import { MapPin, Calendar, Weight, Recycle, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/helpers';
import type { RecycleRequest } from '@/types';

export function RequestCard({ request, href }: { request: RecycleRequest; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={request.status} />
              <span className="text-xs text-stone-400">{formatRelative(request.created_at)}</span>
            </div>
            <h3 className="font-semibold text-stone-800 truncate group-hover:text-forest-700 transition-colors">
              {request.title}
            </h3>
            <p className="text-sm text-stone-500 mt-1 line-clamp-2">{request.description}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Recycle size={12} className="text-forest-500" />{request.waste_type}
              </span>
              {request.estimated_weight && (
                <span className="flex items-center gap-1">
                  <Weight size={12} className="text-earth-500" />{request.estimated_weight} kg
                </span>
              )}
              <span className="flex items-center gap-1 truncate">
                <MapPin size={12} className="text-red-400 flex-shrink-0" />
                <span className="truncate">{request.address}</span>
              </span>
              {request.scheduled_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-blue-400" />
                  {new Date(request.scheduled_at).toLocaleDateString('es')}
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="text-stone-300 group-hover:text-forest-500 flex-shrink-0 mt-1 transition-colors" />
        </div>
      </Card>
    </Link>
  );
}
