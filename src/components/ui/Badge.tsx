import { STATUS_LABELS, STATUS_COLORS } from '@/lib/helpers';
import type { RequestStatus } from '@/types';

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
