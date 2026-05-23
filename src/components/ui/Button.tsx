import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  const variants = {
    primary: 'bg-forest-600 hover:bg-forest-700 text-white focus:ring-forest-500 shadow-lg shadow-forest-200',
    secondary: 'bg-earth-100 hover:bg-earth-200 text-earth-800 focus:ring-earth-400 border border-earth-200',
    ghost: 'bg-transparent hover:bg-forest-50 text-forest-700 focus:ring-forest-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-lg shadow-red-200',
  };
  const sizes = { sm: 'text-sm px-3 py-1.5', md: 'text-sm px-4 py-2.5', lg: 'text-base px-6 py-3' };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
