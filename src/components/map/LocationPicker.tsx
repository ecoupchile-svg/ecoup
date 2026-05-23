'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LocationPickerInner = dynamic(() => import('./LocationPickerInner'), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-xl bg-stone-100 flex items-center justify-center">
      <Loader2 className="animate-spin text-forest-600" />
    </div>
  ),
});

export default LocationPickerInner;
export { LocationPickerInner as LocationPicker };
