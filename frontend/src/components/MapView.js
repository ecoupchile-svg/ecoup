import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const MapView = ({ lat, lng, zoom = 15, markers = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Crear mapa
    const map = L.map(mapRef.current).setView([lat, lng], zoom);
    mapInstanceRef.current = map;

    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Limpiar marcadores existentes
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Añadir nuevos marcadores
    if (markers.length > 0) {
      markers.forEach((marker) => {
        const leafletMarker = L.marker([marker.lat, marker.lng]);
        
        if (marker.popup) {
          leafletMarker.bindPopup(marker.popup);
        }
        
        leafletMarker.addTo(mapInstanceRef.current);
      });

      // Ajustar vista si hay múltiples marcadores
      if (markers.length > 1) {
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapInstanceRef.current.setView([markers[0].lat, markers[0].lng], zoom);
      }
    } else {
      // Si no hay marcadores, centrar en la posición predeterminada
      mapInstanceRef.current.setView([lat, lng], zoom);
      L.marker([lat, lng]).addTo(mapInstanceRef.current);
    }
  }, [markers, lat, lng, zoom]);

  return (
    <div
      data-testid="map-view"
      ref={mapRef}
      className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative z-0"
    />
  );
};
