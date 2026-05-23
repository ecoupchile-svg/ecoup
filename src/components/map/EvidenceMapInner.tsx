'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

async function fixLeafletIcons() {
  if (typeof window !== 'undefined') {
    const L = await import('leaflet');
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
}

export default function EvidenceMapInner({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { void fixLeafletIcons().then(() => setMounted(true)); }, []);
  if (!mounted) return <div className="h-48 rounded-xl bg-stone-100 animate-pulse" />;
  return (
    <div className="h-48 rounded-xl overflow-hidden border border-stone-200">
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]}>{label && <Popup>{label}</Popup>}</Marker>
      </MapContainer>
    </div>
  );
}
