import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { GeoData } from '../../types';

interface GeoMapProps {
  data: Array<GeoData>;
}

function getMarkerColor(count: number, max: number): string {
  if (max === 0) return '#00ff88';
  const ratio = count / max;
  if (ratio >= 0.66) return '#ff3355'; // neon red — high
  if (ratio >= 0.33) return '#ffaa00'; // neon amber — medium
  return '#00ff88';                    // neon green — low
}

function getRadius(count: number, max: number): number {
  if (max === 0) return 6;
  return 6 + ((count / max) * (22 - 6));
}

export default function GeoMap({ data }: GeoMapProps) {
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0;

  return (
    <div
      style={{
        height: '400px',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        willChange: 'transform',
        position: 'relative',
        zIndex: 0,
        border: '1px solid rgba(0,240,255,0.15)',
      }}
      className="w-full"
    >
      <MapContainer
        center={[22.5, 82]}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#050510' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
          keepBuffer={4}
        />
        {data.map((point, idx) => {
          const color = getMarkerColor(point.count, maxCount);
          return (
            <CircleMarker
              key={idx}
              center={[point.lat, point.lon]}
              radius={getRadius(point.count, maxCount)}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.55,
                weight: 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', background: '#0a0a1a', padding: '4px 0' }}>
                  <strong style={{ display: 'block', marginBottom: '2px', color: '#00f0ff' }}>{point.label}</strong>
                  <span style={{ color: '#4a5568' }}>SIGNALS: </span>
                  <span style={{ fontWeight: 700, color: color }}>{point.count.toLocaleString()}</span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
