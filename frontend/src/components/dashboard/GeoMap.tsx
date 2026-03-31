import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { GeoData } from '../../types';

interface GeoMapProps {
  data: Array<GeoData>;
}

function getMarkerColor(count: number, max: number): string {
  if (max === 0) return '#22c55e';
  const ratio = count / max;
  if (ratio >= 0.66) return '#ef4444'; // red — high
  if (ratio >= 0.33) return '#eab308'; // yellow — medium
  return '#22c55e';                     // green — low
}

function getRadius(count: number, max: number): number {
  if (max === 0) return 6;
  const minRadius = 6;
  const maxRadius = 22;
  return minRadius + ((count / max) * (maxRadius - minRadius));
}

export default function GeoMap({ data }: GeoMapProps) {
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0;

  return (
    <div
      style={{ height: '420px', borderRadius: '0.75rem', overflow: 'hidden' }}
      className="w-full border border-slate-700"
    >
      <MapContainer
        center={[22.5, 82]}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        {data.map((point, idx) => (
          <CircleMarker
            key={idx}
            center={[point.lat, point.lon]}
            radius={getRadius(point.count, maxCount)}
            pathOptions={{
              color: getMarkerColor(point.count, maxCount),
              fillColor: getMarkerColor(point.count, maxCount),
              fillOpacity: 0.65,
              weight: 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.92}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', lineHeight: '1.5' }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>{point.label}</strong>
                <span style={{ color: '#94a3b8' }}>Signals: </span>
                <span style={{ fontWeight: 600 }}>{point.count.toLocaleString()}</span>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
