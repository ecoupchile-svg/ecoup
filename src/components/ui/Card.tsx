import { cn } from '@/lib/cn';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow', className)}>
      {children}
    </div>
  );
}
