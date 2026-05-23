'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack
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

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: { latlng: LatLng }) { onSelect(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

interface Props {
  lat?: number; lng?: number;
  onSelect: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

export default function LocationPickerInner({ lat, lng, onSelect, readOnly = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const defaultLat = lat || -33.4489;
  const defaultLng = lng || -70.6693;

  useEffect(() => {
    void fixLeafletIcons().then(() => setMounted(true));
  }, []);

  if (!mounted) return <div className="h-64 rounded-xl bg-stone-100 animate-pulse" />;

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-stone-200">
      <MapContainer center={[defaultLat, defaultLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readOnly && <ClickHandler onSelect={onSelect} />}
        {lat && lng && <Marker position={[lat, lng]} />}
      </MapContainer>
    </div>
  );
}
